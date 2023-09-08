import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'tslog';
const logger = new Logger();

export const requestIdAsyncLocalStorage: AsyncLocalStorage<{
  requestId: string;
}> = new AsyncLocalStorage();

export const useInjectRequestId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId: string = req.headers['x-request-id']?.toString() || uuidv4();

  logger.info('Injecting request id ', requestId);

  await requestIdAsyncLocalStorage.run({ requestId }, async () => {
    return next();
  });
};
