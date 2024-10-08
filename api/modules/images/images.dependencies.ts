import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { ImagesDataProvider } from './images.dataprovider';
import { StabilityAIProvider } from '../../providers/stabilityAI';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  imagesController: asClass(ImagesController).scoped(),
  imagesService: asClass(ImagesService).scoped(),
  imagesDataProvider: asClass(ImagesDataProvider).scoped(),
  stabilityAIProvider: asClass(StabilityAIProvider).singleton(),
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
