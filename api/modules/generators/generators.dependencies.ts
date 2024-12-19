import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { GeneratorsController } from '@/modules/generators/generators.controller';
import { GeneratorsService } from '@/modules/generators/generators.service';
import { GeneratorsDataProvider } from '@/modules/generators/generators.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';
import { ConjurationWorker } from '@/modules/conjurations/generateConjuration.worker';
import { WebSocketProvider } from '@/providers/websocketProvider';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  generatorsController: asClass(GeneratorsController).scoped(),
  generatorsService: asClass(GeneratorsService).scoped(),
  generatorsDataProvider: asClass(GeneratorsDataProvider).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  campaignsDataProvider: asClass(CampaignsDataProvider).scoped(),
  usersDataProvider: asClass(UsersDataProvider).scoped(),
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
