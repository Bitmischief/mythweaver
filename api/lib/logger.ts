import pino, { Logger } from 'pino';
import { isLocalDevelopment } from './utils';
import dotenv from 'dotenv';

dotenv.config();

export class MythWeaverLogger {
  public internalLogger: Logger;

  constructor() {
    this.internalLogger = pino(
      {
        timestamp: pino.stdTimeFunctions.isoTime,
      },
      pino.transport({
        target: isLocalDevelopment ? 'pino-pretty' : '@logtail/pino',
        options: isLocalDevelopment
          ? {
              colorize: true,
            }
          : {
              sourceToken: process.env.BETTERSTACK_LOGGER_SOURCE_TOKEN,
            },
      }),
    );
  }

  public info(message: string, extra?: any) {
    this.internalLogger.info(
      {
        message,
        message_json: extra,
      },
      message,
    );
  }

  public warn(message: string, extra?: any) {
    this.internalLogger.warn(
      {
        message,
        message_json: extra,
      },
      message,
    );
  }

  public fatal(message: string, extra?: any, error?: Error | any) {
    this.internalLogger.fatal(
      {
        error: error
          ? {
              message: error.message,
              stack: error.stack,
            }
          : undefined,
        message,
        message_json: extra,
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
        message_json: extra,
      },
      message,
    );
  }

  public child(bindings: any) {
    this.internalLogger = this.internalLogger.child(bindings);
    return this;
  }
}

export default new MythWeaverLogger();
