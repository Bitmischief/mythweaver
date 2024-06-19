import { Response } from 'express';
import { AppError, HttpCode } from './AppError';
import { AxiosError } from 'axios';
import { useLogger } from '../loggingMiddleware';

class ErrorHandler {
  private isTrustedError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }

    return false;
  }

  public handleError(error: Error | AppError, response?: Response): void {
    if (this.isTrustedError(error) && response) {
      this.handleTrustedError(error as AppError, response);
    } else {
      this.handleCriticalError(error, response);
    }
  }

  private handleTrustedError(error: AppError, response: Response): void {
    response
      .status(error.httpCode)
      .json({ name: error.name, message: error.message });
  }

  private handleCriticalError(
    error: Error | AppError | any,
    response?: Response,
  ): void {
    if (error.status === 401) {
      response
        ?.status(HttpCode.UNAUTHORIZED)
        ?.json({ message: 'Unauthorized' });
      return;
    }

    const localLogger = useLogger();
    localLogger.fatal(
      `Critical uncaught error: ${error?.message}`,
      {
        message: error?.message,
        description: (error as AppError)?.description,
        responseData: (error as AxiosError)?.response?.data,
      },
      error,
    );

    if (response && response.status) {
      response
        ?.status(HttpCode.INTERNAL_SERVER_ERROR)
        ?.json({ message: 'Internal server error' });
    }
  }
}

export const errorHandler = new ErrorHandler();
