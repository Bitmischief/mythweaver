import { NextFunction, Request, Response } from 'express';
import logger, { MythWeaverLogger } from '@/modules/core/logging/logger';
import { v4 as uuidv4 } from 'uuid';
import { isLocalDevelopment } from '@/modules/core/utils/environments';
import { Application } from 'express';
import pinoHTTP from 'pino-http';

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

export const initLoggingMiddleware = (app: Application) => {
  if (!isLocalDevelopment) {
    console.log('Initializing pino');

    const logger = useLogger();

    app.use(
    pinoHTTP({
      logger: logger.internalLogger,
      genReqId: function (req, res) {
        const existingID = req.id ?? req.headers['x-request-id'];
        if (existingID) return existingID;
        const id = uuidv4();
        res.setHeader('X-Request-Id', id);
        return id;
      },
      autoLogging: {
        ignore: (req) => req.url === '/version',
      },
      customProps: function (req, res) {
        return {
          requestId: getRequestId(req, res),
        };
      },
      }),
    );
  }
};
