import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { parentLogger } from './logger';

export const requestIdAsyncLocalStorage: AsyncLocalStorage<{
  requestId: string;
}> = new AsyncLocalStorage();

export const useInjectRequestId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId: string = req.headers['x-request-id']?.toString() || uuidv4();

  parentLogger.info('Injecting request id ', requestId);

  await requestIdAsyncLocalStorage.run({ requestId }, async () => {
    return next();
  });
};
