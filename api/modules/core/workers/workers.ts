import logger from '@/lib/logger';
import { container as conjurationsContainer } from '@/modules/conjurations/conjurations.dependencies';
import { ConjurationWorker } from '@/modules/conjurations/generateConjuration.worker';
import { container as contextContainer } from '@/modules/context/context.dependencies';
import { CampaignContextWorker } from '@/modules/context/workers/campaignContext.worker';
import { DailyCampaignContextWorker } from '@/modules/context/workers/dailyCampaignContext.worker';
import { Worker } from '@/modules/core/workers/worker.interface';
import { MythWeaverImageWorker } from '@/modules/images/mythweaverImage.worker';
import { container as imagesContainer } from '@/modules/images/images.dependencies';

const workers: Worker[] = [
  conjurationsContainer.resolve<ConjurationWorker>('generateConjurationWorker'),
  contextContainer.resolve<DailyCampaignContextWorker>(
    'dailyCampaignContextWorker',
  ),
  contextContainer.resolve<CampaignContextWorker>('indexCampaignContextWorker'),
  imagesContainer.resolve<MythWeaverImageWorker>('mythweaverImageWorker'),
];

export const initWorkers = async () => {
  logger.info('Initializing workers');

  for (const worker of workers) {
    await worker.initializeWorker();
  }

  logger.info('Workers initialized');
};
