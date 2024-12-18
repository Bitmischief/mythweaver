import logger from '@/lib/logger';
import { container as conjurationsContainer } from '@/modules/conjurations/conjurations.dependencies';
import { Worker } from '@/modules/core/workers/worker.interface';

const workers: Worker[] = [
  conjurationsContainer.resolve('generateConjurationWorker'),
];

export const initWorkers = () => {
  logger.info('Initializing workers');
  for (const worker of workers) {
    worker.initializeWorker();
  }
  logger.info('Workers initialized');
};
