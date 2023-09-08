import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { parentLogger } from './logger';
const logger = parentLogger.getSubLogger();

export const useAuthenticateRequest = (securityType = 'jwt') => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
  securityName: string
): Promise<boolean> {
  if (securityName === 'jwt') {
    const token =
      req.body.token || req.query.token || req.headers['authorization'];

    logger.info('Authenticating provided jwt', token);

    const { userId } = verifyJwt(token);

    res.locals.auth = {
      userId,
    };

    return true;
  }

  return false;
}

export const verifyJwt = (token: string) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
  const { userId } = decoded as any;

  logger.info(`Request authenticated for user id ${userId}`);

  return {
    userId: userId as string,
  };
};
