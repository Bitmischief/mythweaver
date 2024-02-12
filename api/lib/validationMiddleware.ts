import { ZodObject } from 'zod';
import { NextFunction, Request, Response } from 'express';
import { injectRequestId } from './loggingMiddleware';

export enum ValidationTypes {
  Body,
  Query,
  Route,
}

export interface ValidationOptions {
  validationType:
    | ValidationTypes.Body
    | ValidationTypes.Query
    | ValidationTypes.Route;
  logRequest?: boolean;
}

export const useValidateRequest = (
  schema: ZodObject<any>,
  options: ValidationOptions = {
    validationType: ValidationTypes.Body,
    logRequest: true,
  },
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = injectRequestId(req, res);

    if (!options) {
      options = {
        validationType: ValidationTypes.Body,
        logRequest: true,
      };
    }
    if (options.logRequest === undefined) {
      options.logRequest = true;
    }

    let validationObj;
    if (options.validationType === ValidationTypes.Body) {
      validationObj = req.body;
    } else if (options.validationType === ValidationTypes.Query) {
      validationObj = req.query;
    } else if (options.validationType === ValidationTypes.Route) {
      validationObj = req.params;
    } else {
      throw new Error('Invalid validation type provided!');
    }

    if (options.logRequest) {
      logger.info(validationObj, 'Validating request...');
    } else {
      logger.info(
        'Skipped validation request logging due to validations options logRequest flag being set to false...',
      );
    }

    const result = schema.safeParse(validationObj);

    if (!result.success) {
      logger.warn('Validation failed', result.error);

      return res.status(400).json({
        errors: result.error.errors,
      });
    }

    logger.info('Validation succeeded...');

    if (options.validationType === ValidationTypes.Body) {
      req.body = result.data;
    } else if (options.validationType === ValidationTypes.Query) {
      req.query = result.data;
    } else if (options.validationType === ValidationTypes.Route) {
      req.params = result.data;
    }

    next();
  };
};
