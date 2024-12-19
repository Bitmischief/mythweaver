import { asClass, asFunction, createContainer, InjectionMode } from 'awilix';
import { useLogger } from '@/modules/core/logging/loggingMiddleware';
import { DailyCampaignContextWorker } from '@/modules/context/workers/dailyCampaignContext.worker';
import { ContextService } from '@/modules/context/context.service';
import { CampaignContextWorker } from './workers/campaignContext.worker';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
});

container.register({
  dailyCampaignContextWorker: asClass(DailyCampaignContextWorker).singleton(),
  indexCampaignContextWorker: asClass(CampaignContextWorker).singleton(),
  contextService: asClass(ContextService).singleton(),
  logger: asFunction(useLogger).singleton(),
});
