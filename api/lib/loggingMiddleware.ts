import { NextFunction, Request, Response } from 'express';
import logger, { MythWeaverLogger } from './logger';
import { v4 as uuidv4 } from 'uuid';

export const useInjectLoggingInfo = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId: string =
      req.headers['x-request-id']?.toString() || uuidv4();

    logger.info('Injecting logging info');

    res.locals.logger = logger.child({
      userId: res.locals.auth?.userId,
      userEmail: res.locals.auth?.email,
      url: req.url,
      method: req.method,
      requestId,
      trackingInfo: res.locals.trackingInfo,
    });

    return next();
  };
};

export const useLogger = (res: Response): MythWeaverLogger => {
  return res.locals.logger || logger;
};
