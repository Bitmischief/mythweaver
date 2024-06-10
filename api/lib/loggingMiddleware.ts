import { NextFunction, Request, Response } from 'express';
import logger, { MythWeaverLogger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export const getRequestId = (req: Request, res: Response) =>
  (res.getHeader('x-request-id') as string) ||
  (req.id as string) ||
  (req.headers['x-request-id'] as string) ||
  uuidv4();

export const injectRequestId = (req: Request, res: Response) => {
  const currentLogger = useLogger(res);

  const requestId = getRequestId(req, res);

  res.locals.logger = currentLogger.child({ requestId });
  return res.locals.logger;
};

export const useInjectLoggingInfo = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.locals.logger = logger.child({
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

export const useLogger = (res: Response): MythWeaverLogger => {
  return res.locals.logger || logger;
};
