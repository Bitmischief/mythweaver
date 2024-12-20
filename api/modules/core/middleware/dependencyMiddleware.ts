import container from '@/dependencies';
import { NextFunction, Request, Response } from 'express';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';

export const useInjectDependencies = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = useLogger();
    logger.info('Injecting dependencies');
    req.container = container.createScope();
    logger.info('Dependencies injected');
    next();
  };
};
