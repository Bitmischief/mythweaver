import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { parentLogger } from './logger';

export const loggingInfoAsyncLocalStorage: AsyncLocalStorage<{
  userId: number | undefined;
  userEmail: string | undefined;
  url: string;
  method: string;
}> = new AsyncLocalStorage();

export const useInjectLoggingInfo = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loggingInfo = {
      userId: res.locals.auth?.userId,
      userEmail: res.locals.auth?.email,
      url: req.url,
      method: req.method,
    };

    parentLogger.info('Injecting logging info', loggingInfo);

    await loggingInfoAsyncLocalStorage.run(loggingInfo, async () => {
      return next();
    });
  };
};
