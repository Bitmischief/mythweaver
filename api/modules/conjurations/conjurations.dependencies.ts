import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { ConjurationsController } from '@/modules/conjurations/conjurations.controller';
import { ConjurationsService } from '@/modules/conjurations/conjurations.service';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { ConjurationsRelationshipsDataProvider } from '@/modules/conjurations/relationships/relationships.dataprovider';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { ConjurationWorker } from '@/modules/conjurations/generateConjuration.worker';
import { WebSocketProvider } from '@/providers/websocketProvider';

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
