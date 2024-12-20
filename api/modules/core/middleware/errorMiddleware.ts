import { Application, ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { errorHandler } from '@/modules/core/errors/ErrorHandler';

export const initErrorHandlerMiddleware = (app: Application) => {
  const errorHandlerMiddleware: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
  ) => {
    const localLogger = useLogger();
    localLogger.error(
      `Error handler middleware: ${err?.message}`,
      { req, res },
      err,
    );
    errorHandler.handleError(err, res);
  };

  app.use(errorHandlerMiddleware);

  process.on('unhandledRejection', (reason: Error | any) => {
    console.error(`Unhandled Rejection: ${reason.message || reason}`);

    throw new Error(reason.message || reason);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error(`Uncaught Exception: ${error.message}`);

    errorHandler.handleError(error);
  });
}
