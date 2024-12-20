import logger from '@/modules/core/logging/logger';
import { GenerateConjurationWorker } from '@/modules/conjurations/workers/generateConjuration.worker';
import { CampaignContextWorker } from '@/modules/context/workers/campaignContext.worker';
import { DailyCampaignContextWorker } from '@/modules/context/workers/dailyCampaignContext.worker';
import { Worker } from '@/modules/core/workers/worker.interface';
import { MythWeaverImageWorker } from '@/modules/images/mythweaverImage.worker';
import { EndTrialWorker } from '@/modules/users/workers/endTrial.worker';
import { ExpiredSubscriptionWorker } from '@/modules/users/workers/expiredSubscription.worker';
import { SubscriptionPlanUpdateWorker } from '@/modules/users/workers/subscriptionPlanUpdate.worker';
import container from '@/modules/core/workers/workers.dependencies';

export const initWorkers = async () => {
  logger.info('Initializing workers');

  const workers: Worker[] = [
    container.resolve<GenerateConjurationWorker>('generateConjurationWorker'),
    container.resolve<DailyCampaignContextWorker>('dailyCampaignContextWorker'),
    container.resolve<CampaignContextWorker>('indexCampaignContextWorker'),
    container.resolve<MythWeaverImageWorker>('mythweaverImageWorker'),
    container.resolve<EndTrialWorker>('endTrialWorker'),
    container.resolve<ExpiredSubscriptionWorker>('expiredSubscriptionWorker'),
    container.resolve<SubscriptionPlanUpdateWorker>(
      'subscriptionPlanUpdateWorker',
    ),
  ];

  for (const worker of workers) {
    await worker.initializeWorker();
  }

  logger.info('Workers initialized');
};
