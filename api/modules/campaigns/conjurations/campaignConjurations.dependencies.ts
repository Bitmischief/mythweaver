import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { CampaignConjurationsController } from '@/modules/campaigns/conjurations/campaignConjurations.controller';
import { CampaignConjurationsService } from '@/modules/campaigns/conjurations/campaignConjurations.service';
import { CampaignConjurationsDataProvider } from '@/modules/campaigns/conjurations/campaignConjurations.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { useLogger } from '@/lib/loggingMiddleware';
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
