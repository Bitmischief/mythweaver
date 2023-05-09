import {ZodObject} from "zod";
import {NextFunction, Request, Response} from "express";
import {parentLogger} from "./logger";
const logger = parentLogger.getSubLogger();

export enum ValidationTypes {
  Body,
  Query,
  Route,
}

export interface ValidationOptions {
  validationType: ValidationTypes.Body | ValidationTypes.Query | ValidationTypes.Route;
}

export const useValidateRequest = (schema: ZodObject<any>, options: ValidationOptions = {
  validationType: ValidationTypes.Body,
}) => {
  return async(req: Request, res: Response, next: NextFunction) => {
    if (!options) {
      options = {
        validationType: ValidationTypes.Body,
      };
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

    logger.info('Validating request...', validationObj);

    const result = schema.safeParse(validationObj);

    if (!result.success) {
      logger.warn('Validation failed', result.error);

      return res
        .status(400)
        .json({
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