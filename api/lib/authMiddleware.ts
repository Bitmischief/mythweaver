import { jwtDecode } from 'jwt-decode';
import { NextFunction, Request, Response } from 'express';
import { prisma } from './providers/prisma';
import { useLogger } from './loggingMiddleware';
import { auth } from 'express-oauth2-jwt-bearer';
import { createCustomer } from '../services/billing';
import { modifyImageCreditCount } from '../services/credits';
import { ImageCreditChangeType } from '@prisma/client';
import mailchimpClient from './mailchimpMarketing';
import { lists, Status } from '@mailchimp/mailchimp_marketing';
import { format } from 'date-fns';
import { AppEvent, track } from './tracking';
import { AdConversionEvent, reportAdConversionEvent } from './ads';
import { createCampaign } from '../dataAccess/campaigns';
import EmailType = lists.EmailType;

export const checkAuth0Jwt = auth({
  audience: process.env.API_URL,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authRequired: true,
});

export const useAuthenticateServiceRequest = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = useLogger();

    try {
      const result = await expressServiceAuthentication(req, res);

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
  res: Response,
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
      user = await createNewUser(res, jwt.email, logger);
    }

    res.locals.auth = {
      userId: user.id,
      email: jwt.email,
      user: user,
    };

    return next();
  };
};

const createNewUser = async (res: Response, email: string, logger: any) => {
  const earlyAccessEnd = new Date();
  earlyAccessEnd.setHours(new Date().getHours() + 24 * 7);

  const stripeCustomerId = await createCustomer(email);

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

  await createCampaign({ userId: user.id, name: 'My Campaign' });

  await prisma.collections.create({
    data: {
      campaignId: campaign.id,
      name: campaign.name,
      userId: user.id,
    },
  });

  const response = (await mailchimpClient.lists.batchListMembers(
    process.env.MAILCHIMP_AUDIENCE_ID as string,
    {
      members: [
        {
          email_address: email,
          email_type: 'html' as EmailType,
          status: 'subscribed' as Status,
          ip_opt: res.locals.trackingInfo?.ip,
          ip_signup: res.locals.trackingInfo?.ip,
          timestamp_signup: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          timestamp_opt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        },
      ],
    },
  )) as any;

  if (response?.errors?.length > 0) {
    logger.warn('Received errors from Mailchimp', response.errors);
  }

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
