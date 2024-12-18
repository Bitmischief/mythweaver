import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CollectionsController } from '@/modules/collections/collections.controller';
import { CollectionsService } from '@/modules/collections/collections.service';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { ContextService } from '../context/context.service';
import { CampaignContextWorker } from '../context/workers/campaignContext.worker';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  collectionsController: asClass(CollectionsController).scoped(),
  collectionsService: asClass(CollectionsService).scoped(),
  collectionsDataProvider: asClass(CollectionsDataProvider).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  webSocketProvider: asClass(WebSocketProvider).singleton(),
  contextService: asClass(ContextService).scoped(),
  indexCampaignContextWorker: asClass(CampaignContextWorker).singleton(),
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
