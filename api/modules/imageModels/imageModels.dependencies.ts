import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ImageModelsController } from '@/modules/imageModels/imageModels.controller';
import { ImageModelsService } from '@/modules/imageModels/imageModels.service';
import { ImageModelsDataProvider } from '@/modules/imageModels/imageModels.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
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
