import {
  asClass,
  asFunction,
  createContainer,
  InjectionMode,
  Lifetime,
} from 'awilix';
import { NextFunction, Request, Response } from 'express';
import { useLogger } from '../../lib/loggingMiddleware';
import { RunPodProvider } from '../../providers/runPod';
import { StabilityAIProvider } from '../../providers/stabilityAI';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { CompletedImageService } from './completedImage.service';
import { ImagesDataProvider } from './images.dataprovider';
import { ImageModelsDataProvider } from '../imageModels/imageModels.dataprovider';
import { MythWeaverImageProvider } from './mythweaverImage.provider';
import { MythWeaverImageWorker } from './mythweaverImage.worker';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

const SINGLETON = { lifetime: Lifetime.SINGLETON };

container.register({
  imagesController: asClass(ImagesController).scoped(),
  imagesService: asClass(ImagesService).scoped(),
  completedImageService: asClass(CompletedImageService).scoped(),
  imagesDataProvider: asClass(ImagesDataProvider).scoped(),
  imageModelsDataProvider: asClass(ImageModelsDataProvider).scoped(),
  stabilityAIProvider: asClass(StabilityAIProvider, SINGLETON),
  runPodProvider: asClass(RunPodProvider, SINGLETON),
  mythweaverImageProvider: asClass(MythWeaverImageProvider).scoped(),
  mythweaverImageWorker: asFunction(() => {
    const deps = {
      logger: container.resolve('logger'),
      runPodProvider: container.resolve('runPodProvider'),
      imagesDataProvider: container.resolve('imagesDataProvider'),
      completedImageService: container.resolve('completedImageService'),
    };

    return MythWeaverImageWorker.getInstance(
      deps.logger,
      deps.runPodProvider,
      deps.imagesDataProvider,
      deps.completedImageService,
    );
  }, SINGLETON),
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
