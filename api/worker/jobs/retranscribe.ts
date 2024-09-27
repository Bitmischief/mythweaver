import Queue from 'bull';
import { prisma } from '../../lib/providers/prisma';
import logger from '../../lib/logger';
import { config } from '../config';
import { sessionTranscriptionQueue } from './transcribeSession';
import { processInChunks } from '../../lib/utils';
import { BillingPlan, Prisma } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface RetranscribeSessionsEvent {}

export const retranscribeSessionsQueue = new Queue<RetranscribeSessionsEvent>(
  'retranscribe-sessions',
  config,
);

retranscribeSessionsQueue.process(async (job, done) => {
  logger.info('Processing retranscribe sessions job', job.data);

  try {
    await retranscribeSessions();
    logger.info('Completed processing retranscribe sessions job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing retranscribe sessions job!', err);
    done(new Error('Error processing retranscribe sessions job!'));
  }
});

const retranscribeSessions = async () => {
  await processInChunks(
    5,
    (skip, take) =>
      prisma.sessionTranscription.findMany({
        where: {
          OR: [
            {
              sentences: {
                equals: Prisma.DbNull,
              }
            },
            {
              sentences: {
                equals: Prisma.JsonNull,
              }
            }
          ]
        },
        skip,
        take,
      }),
    async (transcript) => {
      await sessionTranscriptionQueue.add({
        sessionId: transcript.sessionId,
        userId: transcript.userId,
      });
      
      await prisma.sessionTranscription.deleteMany({
        where: {
          sessionId: transcript.sessionId,
        },
      });
    },
    2 * 60 * 1000,
  );
};
