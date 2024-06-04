import Queue from 'bull';
import { processTags } from './jobs/processTags';
import { conjure } from './jobs/conjure';
import { completeSession } from './jobs/completeSession';
import { ImageStylePreset } from '../controllers/images';
import logger from '../lib/logger';
import { endTrials } from './jobs/endTrials';
import { processLifetimeSubscriptionCredits } from './jobs/processLifetimeSubscriptionCredits';
import { AppError, ErrorType, HttpCode } from '../lib/errors/AppError';
import { checkImageStatus } from './jobs/imageStatus';

const config = process.env.REDIS_ENDPOINT || '';

export interface ProcessTagsEvent {
  conjurationIds: number[];
}

export const processTagsQueue = new Queue<ProcessTagsEvent>(
  'process-tags',
  config,
);

processTagsQueue.process(async (job, done) => {
  logger.info('Processing tags job', job.data);

  try {
    await processTags(job.data.conjurationIds);
  } catch (err) {
    logger.error('Error processing generated image job!', err);
  }

  done();
});

export interface ConjureEvent {
  userId: number;
  conjurationRequestId: number;
  campaignId: number;
  generatorCode: string;
  count: number;
  arg?: string | undefined;
  imageStylePreset?: ImageStylePreset;
  imagePrompt?: string | undefined;
  imageNegativePrompt?: string | undefined;
  type?: string;
}

export const conjureQueue = new Queue<ConjureEvent>('conjuring', config);

conjureQueue.process(async (job, done) => {
  logger.info('Processing conjure job', job.data);

  const jobPromises = [];

  for (let i = 0; i < job.data.count; i++) {
    const promise = conjure(job.data);
    jobPromises.push(promise);
  }

  try {
    await Promise.all(jobPromises);
    logger.info('Completed processing conjure job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing conjure job!', err);

    done(
      new AppError({
        description:
          'There was an error generating your conjuration. Please try again.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: job.data.userId,
          errorCode: ErrorType.ConjurationError,
        },
      }),
    );
  }
});

export interface CompleteSessionEvent {
  userId: number;
  sessionId: number;
}

export const completeSessionQueue = new Queue<CompleteSessionEvent>(
  'complete-session',
  config,
);

completeSessionQueue.process(async (job, done) => {
  logger.info('Processing complete session job', job.data);

  try {
    await completeSession(job.data);
    logger.info('Completed processing conjure job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing conjure job!', err);
    done(new Error('Error processing conjure job!'));
  }
});

export const endTrialQueue = new Queue('end-trial', config);

endTrialQueue.process(async (job, done) => {
  logger.info('Processing end trial job');

  try {
    await endTrials();
    logger.info('Completed processing end trials job');
    done();
  } catch (err) {
    logger.error('Error processing end trials job!', err);
    done(new Error('Error processing end trials job!'));
  }
});

export const lifetimeSubscriptionCreditQueue = new Queue(
  'lifetime-subscription-credits',
  config,
);

lifetimeSubscriptionCreditQueue.process(async (job, done) => {
  logger.info('Processing end lifetime subscription credits job');

  try {
    await processLifetimeSubscriptionCredits();
    logger.info('Completed processing lifetime subscription credits job');
    done();
  } catch (err) {
    logger.error('Error processing lifetime subscription credits job!', err);
    done(new Error('Error processing lifetime subscription credits job!'));
  }
});

export const checkImageStatusQueue = new Queue('check-image-status', config);

checkImageStatusQueue.process(async (job, done) => {
  logger.info('Processing check image status job', job.data);

  try {
    await checkImageStatus(job.data);
    logger.info('Completed processing check image status job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing check image status job!', err);
    done(new Error('Error processing check image status job!'));
  }
});
