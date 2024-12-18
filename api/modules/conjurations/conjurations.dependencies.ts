import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ConjurationsController } from './conjurations.controller';
import { ConjurationsService } from './conjurations.service';
import { ConjurationsDataProvider } from './conjurations.dataprovider';
import { ConjurationsRelationshipsDataProvider } from './relationships/relationships.dataprovider';
import { CollectionsDataProvider } from '../collections/collections.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { MembersDataProvider } from '../campaigns/members/members.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { ConjurationWorker } from './generateConjuration.worker';
import { WebSocketProvider } from '../../providers/websocketProvider';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  conjurationsController: asClass(ConjurationsController).scoped(),
  conjurationsService: asClass(ConjurationsService).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  conjurationsRelationshipsDataProvider: asClass(
    ConjurationsRelationshipsDataProvider,
  ).scoped(),
  membersDataProvider: asClass(MembersDataProvider).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  collectionsDataProvider: asClass(CollectionsDataProvider).scoped(),
  generateConjurationWorker: asClass(ConjurationWorker).singleton(),
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
