import pino, { Logger } from 'pino';
import { isLocalDevelopment } from './utils';

export class MythWeaverLogger {
  public internalLogger: Logger;

  constructor() {
    this.internalLogger = pino(
      {
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      isLocalDevelopment
        ? undefined
        : pino.transport({
            target: '@logtail/pino',
            options: {
              sourceToken: process.env.BETTERSTACK_LOGGER_SOURCE_TOKEN,
            },
          }),
    );
  }

  public info(message: string, extra?: any) {
    this.internalLogger.info(
      {
        message,
        ...extra,
      },
      message,
    );
  }

  public warn(message: string, extra?: any) {
    this.internalLogger.warn(
      {
        message,
        ...extra,
      },
      message,
    );
  }

  public fatal(message: string, extra?: any) {
    this.internalLogger.fatal(
      {
        message,
        ...extra,
      },
      message,
    );
  }

  public error(message: string, extra?: any, error?: Error | any) {
    this.internalLogger.error(
      {
        error: error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        message,
        extra,
      },
      message,
    );
  }

  public child(context: any) {
    return this.internalLogger.child(context);
  }
}

export default new MythWeaverLogger();
