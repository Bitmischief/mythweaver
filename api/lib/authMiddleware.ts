import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './providers/prisma';
import { MythWeaverLogger } from './logger';
import { injectRequestId } from './loggingMiddleware';

export enum SecurityType {
  JWT = 'jwt',
  ServiceToken = 'service-token',
}

export const useAuthenticateRequest = (securityType = SecurityType.JWT) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = injectRequestId(req, res);

    try {
      const result = await expressAuthentication(req, res, securityType);

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

export async function expressAuthentication(
  req: Request,
  res: Response,
  securityName: SecurityType,
): Promise<boolean> {
  const logger = injectRequestId(req, res);

  if (securityName === 'jwt') {
    const token =
      req.body.token || req.query.token || req.headers['authorization'];

    logger.info('Authenticating provided jwt', token);

    const { userId } = verifyJwt(token, logger);

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    if (!user) {
      return false;
    }

    res.locals.auth = {
      userId: user.id,
      email: user.email,
    };

    return true;
  }

  if (securityName === SecurityType.ServiceToken) {
    const req_token = req.headers['x-mw-token'];

    logger.info('Authenticating provided service token.');

    const serviceToken = process.env.X_SERVICE_TOKEN;
    if (!serviceToken) {
      logger.error('No "x-mw-token" env variable found.');
      return false;
    }

    return serviceToken === req_token;
  }

  return false;
}

export const verifyJwt = (token: string, logger: MythWeaverLogger) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
  const { userId } = decoded as any;

  logger.info(`Request authenticated for user id ${userId}`);

  return {
    userId: userId as string,
  };
};
