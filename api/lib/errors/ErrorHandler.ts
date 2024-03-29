import { Response } from 'express';
import { AppError, HttpCode } from './AppError';
import { AxiosError } from 'axios';
import logger from '../logger';

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
    response.status(error.httpCode).json({ message: error.message });
  }

  private handleCriticalError(
    error: Error | AppError,
    response?: Response,
  ): void {
    logger.fatal('Critical uncaught error', {
      message: error?.message,
      description: (error as AppError)?.description,
      responseData: (error as AxiosError)?.response?.data,
    });

    if (response && response.status) {
      response
        ?.status(HttpCode.INTERNAL_SERVER_ERROR)
        ?.json({ message: 'Internal server error' });
    }
  }
}

export const errorHandler = new ErrorHandler();
