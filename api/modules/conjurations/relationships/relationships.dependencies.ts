import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ConjurationsRelationshipsController } from './relationships.controller';
import { ConjurationsRelationshipsService } from './relationships.service';
import { ConjurationsRelationshipsDataProvider } from './relationships.dataprovider';
import { CollectionsDataProvider } from '../../collections/collections.dataprovider';
import { useLogger } from '../../../lib/loggingMiddleware';
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
