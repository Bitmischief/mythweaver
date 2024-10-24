import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CampaignConjurationsController } from './campaignConjurations.controller';
import { CampaignConjurationsService } from './campaignConjurations.service';
import { CampaignConjurationsDataProvider } from './campaignConjurations.dataprovider';
import { ConjurationsDataProvider } from '../../conjurations/conjurations.dataprovider';
import { CampaignsDataProvider } from '../campaigns.dataprovider';
import { useLogger } from '../../../lib/loggingMiddleware';
import { NextFunction, Request, Response } from 'express';

const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  campaignConjurationsController: asClass(
    CampaignConjurationsController,
  ).scoped(),
  campaignConjurationsService: asClass(CampaignConjurationsService).scoped(),
  campaignConjurationsDataProvider: asClass(
    CampaignConjurationsDataProvider,
  ).scoped(),
  conjurationsDataProvider: asClass(ConjurationsDataProvider).scoped(),
  campaignsDataProvider: asClass(CampaignsDataProvider).scoped(),
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
