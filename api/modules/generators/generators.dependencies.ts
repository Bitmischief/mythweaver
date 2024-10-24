import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { GeneratorsController } from './generators.controller';
import { GeneratorsService } from './generators.service';
import { GeneratorsDataProvider } from './generators.dataprovider';
import { ConjurationsDataProvider } from '../conjurations/conjurations.dataprovider';
import { CampaignsDataProvider } from '../campaigns/campaigns.dataprovider';
import { UsersDataProvider } from '../users/users.dataprovider';
import { useLogger } from '../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

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
