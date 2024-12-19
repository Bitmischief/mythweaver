import Queue, { Job } from 'bull';
import { prisma } from '@/providers/prisma';
import { User } from '@prisma/client';
import { MythWeaverLogger } from '@/modules/core/logging/logger';
import { config } from '@/modules/core/workers/worker.config';
import { processInChunks } from '@/modules/core/utils/chunks';

interface SubscriptionPlanUpdateEvent {
  batchSize?: number;
}

const DEFAULT_BATCH_SIZE = 10;

export const subscriptionPlanUpdateQueue =
  new Queue<SubscriptionPlanUpdateEvent>('subscription-plan-update', config, {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
    },
  });

export class SubscriptionPlanUpdateWorker {
  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly prismaClient = prisma,
  ) {}

  async initializeWorker(): Promise<void> {
    subscriptionPlanUpdateQueue.process(
      async (job: Job<SubscriptionPlanUpdateEvent>) => {
        this.logger.info('Processing subscription plan update job', {
          jobId: job.id,
          data: job.data,
        });

        try {
          await this.updateSubscriptionPlans(
            job.data.batchSize || DEFAULT_BATCH_SIZE,
          );
          this.logger.info('Completed processing subscription plan update job');
        } catch (err) {
          this.logger.error('Error processing subscription plan update job', {
            jobId: job.id,
            error: err,
          });
          throw new Error('Error processing subscription plan update job');
        }
      },
    );

    subscriptionPlanUpdateQueue.on(
      'failed',
      (job: Job<SubscriptionPlanUpdateEvent>, err: Error) => {
        this.logger.error('Subscription plan update job failed', {
          jobId: job.id,
          data: job.data,
          error: err,
        });
      },
    );

    await this.scheduleWorker();

    this.logger.info(
      'Subscription plan update worker initialized successfully',
    );
  }

  private async scheduleWorker(): Promise<void> {
    const jobId = 'subscription-plan-update-job';

    const scheduledJobs = await subscriptionPlanUpdateQueue.getRepeatableJobs();

    if (scheduledJobs.some((job) => job.id === jobId)) {
      this.logger.info('Subscription plan update job already scheduled');
      return;
    }

    await subscriptionPlanUpdateQueue.add(
      {},
      {
        repeat: { cron: '0 * * * *' },
        jobId,
      },
    );

    this.logger.info('Subscription plan update job scheduled');
  }

  private async updateSubscriptionPlans(batchSize: number): Promise<void> {
    const currentDate = new Date();

    await processInChunks(
      batchSize,
      (skip: number, take: number) =>
        this.prismaClient.user.findMany({
          where: {
            pendingPlanChangeEffectiveDate: {
              lte: currentDate,
            },
            pendingPlanChange: {
              not: null,
            },
          },
          skip,
          take,
        }),
      async (user: User) => {
        if (!user.pendingPlanChange) {
          this.logger.error(
            'Somehow received a user without a pending plan change',
            { userId: user.id },
          );
          return;
        }

        await this.prismaClient.user.update({
          where: { id: user.id },
          data: {
            plan: user.pendingPlanChange,
            pendingPlanChange: null,
            pendingPlanChangeEffectiveDate: null,
          },
        });

        this.logger.info('Updated user plan due to pending plan change', {
          userId: user.id,
          newPlan: user.pendingPlanChange,
        });
      },
    );
  }

  async addJob(
    data: SubscriptionPlanUpdateEvent = {},
  ): Promise<Job<SubscriptionPlanUpdateEvent>> {
    return subscriptionPlanUpdateQueue.add(data);
  }
}
