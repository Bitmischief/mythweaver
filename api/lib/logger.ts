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

  public info(message: string, context?: any) {
    this.internalLogger.info(context, message);
  }

  public warn(message: string, context?: any) {
    this.internalLogger.warn(context, message);
  }

  public fatal(message: string, context?: any) {
    this.internalLogger.fatal(context, message);
  }

  public error(message: string, context?: any, error?: Error | any) {
    this.internalLogger.error(
      {
        error: error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        context,
      },
      message,
    );
  }

  public child(context: any) {
    return this.internalLogger.child(context);
  }
}

export default new MythWeaverLogger();
