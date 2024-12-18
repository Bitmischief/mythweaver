import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { CreditsProvider } from '@/providers/creditsProvider';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { EndTrialWorker } from './workers/endTrial.worker';
import { ExpiredSubscriptionWorker } from './workers/expiredSubscription.worker';
import { SubscriptionPlanUpdateWorker } from './workers/subscriptionPlanUpdate.worker';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  usersController: asClass(UsersController).scoped(),
  usersService: asClass(UsersService).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  creditsProvider: asClass(CreditsProvider).singleton(),
  webSocketProvider: asClass(WebSocketProvider).singleton(),
  logger: asFunction(useLogger).singleton(),
  endTrialWorker: asClass(EndTrialWorker).singleton(),
  expiredSubscriptionWorker: asClass(ExpiredSubscriptionWorker).singleton(),
  subscriptionPlanUpdateWorker: asClass(
    SubscriptionPlanUpdateWorker,
  ).singleton(),
});

export const injectDependencies = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.container = container.createScope();
  next();
};
