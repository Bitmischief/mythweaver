import Queue from 'bull';
import { parentLogger } from '../lib/logger';
import { processTags } from './jobs/processTags';
import { conjure } from './jobs/conjure';
import { completeSession } from './jobs/completeSession';
import { tagUsersAsEarlyAccess } from './jobs/tagUsersAsEarlyAccess';
const logger = parentLogger.getSubLogger();

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
  imageStylePreset?: string | undefined;
  imagePrompt?: string | undefined;
  imageNegativePrompt?: string | undefined;
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
    done(new Error('Error processing conjure job!'));
  }
});

export interface CompleteSessionEvent {
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

export const tagUsersAsEarlyAccessQueue = new Queue(
  'tag-users-early-access',
  config,
);

tagUsersAsEarlyAccessQueue.process(async (job, done) => {
  logger.info('Processing tag users as early access job', job.data);

  try {
    await tagUsersAsEarlyAccess();
    logger.info('Completed processing tag users as early access job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing tag users as early access job!', err);
    done(new Error('Error processing tag users as early access job!'));
  }
});
