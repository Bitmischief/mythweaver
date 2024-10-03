import { NextFunction, Request, Response } from 'express';
import logger, { MythWeaverLogger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export const getRequestId = (req: Request, res: Response) =>
  (res.getHeader('x-request-id') as string) ||
  ((req as any).id as string) ||
  (req.headers['x-request-id'] as string) ||
  uuidv4();

export const injectRequestId = (req: Request, res: Response) => {
  const requestId = getRequestId(req, res);
  logger.child({ requestId });
};

export const useInjectLoggingInfo = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.child({
      userId: res.locals.auth?.userId,
      userEmail: res.locals.auth?.email,
      url: req.originalUrl,
      method: req.method,
      trackingInfo: res.locals.trackingInfo,
    });

    injectRequestId(req, res);

    return next();
  };
};

export const useLogger = (): MythWeaverLogger => {
  return logger;
};
