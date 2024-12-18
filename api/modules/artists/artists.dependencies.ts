import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { ArtistsController } from '@/modules/artists/artists.controller';
import { ArtistsService } from '@/modules/artists/artists.service';
import { ArtistsDataProvider } from '@/modules/artists/artists.dataprovider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  artistsController: asClass(ArtistsController).scoped(),
  artistsService: asClass(ArtistsService).scoped(),
  artistsDataProvider: asClass(ArtistsDataProvider).scoped(),
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
