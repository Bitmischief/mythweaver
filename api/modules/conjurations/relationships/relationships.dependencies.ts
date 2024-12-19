import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ConjurationsRelationshipsController } from '@/modules/conjurations/relationships/relationships.controller';
import { ConjurationsRelationshipsService } from '@/modules/conjurations/relationships/relationships.service';
import { ConjurationsRelationshipsDataProvider } from '@/modules/conjurations/relationships/relationships.dataprovider';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  conjurationsRelationshipsController: asClass(
    ConjurationsRelationshipsController,
  ).scoped(),
  conjurationsRelationshipsService: asClass(
    ConjurationsRelationshipsService,
  ).scoped(),
  conjurationsRelationshipsDataProvider: asClass(
    ConjurationsRelationshipsDataProvider,
  ).scoped(),
  collectionsDataProvider: asClass(CollectionsDataProvider).scoped(),
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
