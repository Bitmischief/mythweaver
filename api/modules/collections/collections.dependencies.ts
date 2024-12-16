import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';
import { CollectionsDataProvider } from './collections.dataprovider';
import { ConjurationsDataProvider } from '../conjurations/conjurations.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { WebSocketProvider } from '../../providers/websocketProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  collectionsController: asClass(CollectionsController).scoped(),
  collectionsService: asClass(CollectionsService).scoped(),
  collectionsDataProvider: asClass(CollectionsDataProvider).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  webSocketProvider: asClass(WebSocketProvider).singleton(),
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
