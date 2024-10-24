import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ImageModelsController } from './imageModels.controller';
import { ImageModelsService } from './imageModels.service';
import { ImageModelsDataProvider } from './imageModels.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  imageModelsController: asClass(ImageModelsController).scoped(),
  imageModelsService: asClass(ImageModelsService).scoped(),
  imageModelsDataProvider: asClass(ImageModelsDataProvider).scoped(),
  logger: asFunction(useLogger).scoped(),
});

export const injectDependencies = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.container = container.createScope();
  next();
};
