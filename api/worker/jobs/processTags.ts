import Queue from 'bull';
import { prisma } from '@/lib/providers/prisma';
import logger from '@/lib/logger';
import { config } from '@/worker/config';

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

export const processTags = async (conjurationIds: number[]) => {
  for (const conjurationId of conjurationIds) {
    await processTag(conjurationId);
  }
};

const processTag = async (conjurationId: number) => {
  logger.info(`Processing tags for conjuration ${conjurationId}.`);

  const conjuration = await prisma.conjuration.findUnique({
    where: {
      id: conjurationId,
    },
  });

  if (!conjuration) {
    logger.info(`Conjuration with id ${conjurationId} not found.`);
    return;
  }

  for (const tag of conjuration.tags) {
    logger.info(`Processing tag ${tag}.`);

    const existingTag = await prisma.tag.findUnique({
      where: {
        name: tag,
      },
    });

    if (!existingTag) {
      logger.info(`Creating tag ${tag}.`);

      await prisma.tag.create({
        data: {
          name: tag,
          usageCount: 1,
        },
      });
    } else {
      logger.info(`Incrementing usage count for tag ${tag}.`);

      await prisma.tag.update({
        where: {
          name: tag,
        },
        data: {
          usageCount: existingTag.usageCount + 1,
        },
      });
    }
  }
};
