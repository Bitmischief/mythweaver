import { jwtDecode } from 'jwt-decode';
import { NextFunction, Request, Response } from 'express';
import { prisma } from './providers/prisma';
import { useLogger } from './loggingMiddleware';
import { auth } from 'express-oauth2-jwt-bearer';
import { modifyImageCreditCount } from '../services/credits';
import { ImageCreditChangeType } from '@prisma/client';
import { AppEvent, track } from './tracking';
import { AdConversionEvent, reportAdConversionEvent } from './ads';
import { createCampaign } from '../dataAccess/campaigns';
import { StripeProvider } from '../providers/stripe';
import { EmailProvider } from '@/providers/emailProvider';

export const checkAuth0Jwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authRequired: true,
});

export const useAuthenticateServiceRequest = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = useLogger();

    try {
      const result = await expressServiceAuthentication(req);

      if (!result) {
        logger.error('Returning 401 for request', req);
        return res.status(401).send();
      }

      next();
    } catch (err) {
      logger.error('Error authorizing request', req.headers, err);
      return res.status(401).send();
    }
  };
};

export async function expressServiceAuthentication(
  req: Request,
): Promise<boolean> {
  const logger = useLogger();

  const req_token = req.headers['x-mw-token'];
  logger.info('Authenticating provided service token.');

  const serviceToken = process.env.X_SERVICE_TOKEN;
  if (!serviceToken) {
    logger.error('No "x-mw-token" env variable found.');
    return false;
  }

  return serviceToken === req_token;
}

export const useInjectUserId = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = useLogger();

    if (res.locals.auth?.email) {
      logger.info('Auth context already injected');
      return next();
    }

    if (!req.auth?.token) {
      return next();
    }

    const token = req.auth?.token || '';
    const jwt = jwtDecode(token) as any;

    if (!jwt.email) {
      return res.status(401).send();
    }

    let user = await prisma.user.findUnique({
      where: {
        email: jwt.email,
      },
    });

    if (!user) {
      user = await createNewUser(res, jwt.email);
    }

    res.locals.auth = {
      userId: user.id,
      email: jwt.email,
      user: user,
    };

    return next();
  };
};

const createNewUser = async (res: Response, email: string) => {
  const earlyAccessEnd = new Date();
  earlyAccessEnd.setHours(new Date().getHours() + 24 * 7);

  const stripeProvider = new StripeProvider();
  const stripeCustomerId = await stripeProvider.createCustomer(email);

  const user = await prisma.user.create({
    data: {
      email: email,
      trialEndsAt: earlyAccessEnd,
      billingCustomerId: stripeCustomerId,
      imageCredits: 0,
      username: await buildUniqueUsername(email.toLowerCase()),
    },
  });

  await modifyImageCreditCount(
    user.id,
    10,
    ImageCreditChangeType.TRIAL,
    'Initial credits for signup',
  );

  const campaign = await createCampaign({
    userId: user.id,
    name: 'My Campaign',
  });

  await prisma.collections.create({
    data: {
      campaignId: campaign.id,
      name: campaign.name,
      userId: user.id,
    },
  });

  const emailProvider = new EmailProvider(useLogger());
  await emailProvider.addEmailToMailingList(email);

  track(AppEvent.Registered, user.id, res.locals.trackingInfo, {
    email,
  });

  await reportAdConversionEvent(AdConversionEvent.Lead, user);

  return user;
};

const buildUniqueUsername = async (email: string) => {
  const username = email.split('@')[0];
  const usernameExists = await prisma.user.findFirst({
    where: {
      username,
    },
  });

  return usernameExists
    ? username + Math.floor(Math.random() * 1000)
    : username;
};

export const useAuthenticateRequest = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = useLogger();

    try {
      // Check for Auth0 JWT
      if (req.headers.authorization?.startsWith('Bearer ')) {
        return checkAuth0Jwt(req, res, next);
      }

      // Check for service token
      const serviceToken = req.headers['x-mw-token'];
      if (serviceToken) {
        const result = await expressServiceAuthentication(req);
        if (result) {
          return next();
        }
      }

      // Check for user token
      const userToken = req.headers['x-user-token'];
      if (userToken) {
        const result = await authenticateUserToken(
          req,
          res,
          userToken as string,
        );
        if (result) {
          return next();
        }
      }

      logger.error('Returning 401 for request', req);
      return res.status(401).send();
    } catch (err) {
      logger.error('Error authorizing request', req.headers, err);
      return res.status(401).send();
    }
  };
};

async function authenticateUserToken(
  req: Request,
  res: Response,
  token: string,
): Promise<boolean> {
  const logger = useLogger();

  const userToken = await prisma.userToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!userToken) {
    logger.error('Invalid user token');
    return false;
  }

  if (userToken.expiresAt && userToken.expiresAt < new Date()) {
    logger.error('Expired user token');
    return false;
  }

  // You can add additional checks for scopes here if needed

  res.locals.auth = {
    userId: userToken.user.id,
    email: userToken.user.email,
    user: userToken.user,
    scopes: userToken.scopes,
  };

  return true;
}
