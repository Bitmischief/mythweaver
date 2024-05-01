import { jwtDecode } from 'jwt-decode';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './providers/prisma';
import { injectRequestId } from './loggingMiddleware';
import { auth } from 'express-oauth2-jwt-bearer';

export const checkAuth0Jwt = auth({
  audience: process.env.API_URL,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authRequired: true,
});

export const useAuthenticateServiceRequest = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = injectRequestId(req, res);

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
  const logger = injectRequestId(req, res);

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
    injectRequestId(req, res);

    const token = req.auth?.token || '';
    const jwt = jwtDecode(token) as any;

    if (!jwt.email) {
      return res.status(401).send();
    }

    const user = await prisma.user.findUnique({
      where: {
        email: jwt.email,
      },
    });

    if (!user) {
      // we need to create a new user here
      console.log('no user exists in the db with this email');
      return res.status(401).send();
    }

    res.locals.auth = {
      userId: user.id,
    };

    return next();
  };
};
