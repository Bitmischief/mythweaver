import { NextFunction, Request, Response } from 'express';
import { prisma } from '@/providers/prisma';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { checkAuth0Jwt } from '@/modules/core/middleware/auth0';

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
