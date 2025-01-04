import Queue, { Job } from 'bull';
import { prisma } from '@/providers/prisma';
import { Logger } from '@/modules/core/logging/logger';
import { config } from '@/modules/core/workers/worker.config';

export interface ProcessTagsEvent {
  conjurationIds: number[];
}

export const processTagsQueue = new Queue<ProcessTagsEvent>(
  'process-tags',
  config,
  {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
    },
  },
);

export class TagsWorker {
  constructor(private readonly logger: Logger) {
    this.initializeWorker();
  }

  initializeWorker(): void {
    processTagsQueue.process(async (job: Job<ProcessTagsEvent>) => {
      this.logger.info('Processing tags job', {
        jobId: job.id,
        data: job.data,
      });

      try {
        await this.processTags(job.data.conjurationIds);
      } catch (err) {
        this.logger.error('Error processing tags job!', err);
        await this.handleFailure(job);
      }
    });

    this.logger.info('Tags worker initialized successfully');
  }

  private async processTags(conjurationIds: number[]): Promise<void> {
    for (const conjurationId of conjurationIds) {
      await this.processTag(conjurationId);
    }
  }

  private async processTag(conjurationId: number): Promise<void> {
    this.logger.info(`Processing tags for conjuration ${conjurationId}`);

    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
    });

    if (!conjuration) {
      this.logger.info(`Conjuration with id ${conjurationId} not found`);
      return;
    }

    for (const tag of conjuration.tags) {
      this.logger.info(`Processing tag ${tag}`);

      const existingTag = await prisma.tag.findUnique({
        where: {
          name: tag,
        },
      });

      if (!existingTag) {
        this.logger.info(`Creating tag ${tag}`);

        await prisma.tag.create({
          data: {
            name: tag,
            usageCount: 1,
          },
        });
      } else {
        this.logger.info(`Incrementing usage count for tag ${tag}`);

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
  }

  private async handleFailure(job: Job<ProcessTagsEvent>): Promise<void> {
    this.logger.error('Tags processing failed', {
      jobId: job.id,
      data: job.data,
    });

    job.discard();
  }
}
