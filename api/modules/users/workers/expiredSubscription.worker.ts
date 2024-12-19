import Queue, { Job } from 'bull';
import { prisma } from '@/providers/prisma';
import { BillingPlan, User } from '@prisma/client';
import { MythWeaverLogger } from '@/modules/core/logging/logger';
import { config } from '@/modules/core/workers/worker.config';
import { differenceInDays } from 'date-fns';
import { processInChunks } from '@/modules/core/utils/chunks';

interface SubscriptionCheckEvent {
  batchSize?: number;
}

const DEFAULT_BATCH_SIZE = 10;

export const expiredSubscriptionCheckQueue = new Queue<SubscriptionCheckEvent>(
  'expired-subscription-check',
  config,
  {
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: true,
    },
  },
);

export class ExpiredSubscriptionWorker {
  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly prismaClient = prisma,
  ) {}

  async initializeWorker(): Promise<void> {
    expiredSubscriptionCheckQueue.process(
      async (job: Job<SubscriptionCheckEvent>) => {
        this.logger.info('Processing nightly subscription check job', {
          jobId: job.id,
          data: job.data,
        });

        try {
          await this.checkSubscriptions(
            job.data.batchSize || DEFAULT_BATCH_SIZE,
          );
          this.logger.info(
            'Completed processing nightly subscription check job',
          );
        } catch (err) {
          this.logger.error('Error processing nightly subscription check job', {
            jobId: job.id,
            error: err,
          });
          throw new Error('Error processing nightly subscription check job');
        }
      },
    );

    expiredSubscriptionCheckQueue.on(
      'failed',
      (job: Job<SubscriptionCheckEvent>, err: Error) => {
        this.logger.error('Subscription check job failed', {
          jobId: job.id,
          data: job.data,
          error: err,
        });
      },
    );

    await this.scheduleWorker();

    this.logger.info('Expired subscription worker initialized successfully');
  }

  private async scheduleWorker(): Promise<void> {
    const jobId = 'nightly-subscription-check-job';

    const scheduledJobs =
      await expiredSubscriptionCheckQueue.getRepeatableJobs();

    if (scheduledJobs.some((job) => job.id === jobId)) {
      this.logger.info('Nightly subscription check job already scheduled');
      return;
    }

    await expiredSubscriptionCheckQueue.add(
      {},
      {
        repeat: { cron: '0 7 * * *' },
        jobId,
      },
    );

    this.logger.info('Nightly subscription check job scheduled');
  }

  private async checkSubscriptions(batchSize: number): Promise<void> {
    const currentDate = new Date();

    await processInChunks(
      batchSize,
      (skip: number, take: number) =>
        this.prismaClient.user.findMany({
          where: {
            subscriptionPaidThrough: {
              lt: currentDate,
            },
            plan: {
              not: BillingPlan.FREE,
            },
          },
          skip,
          take,
        }),
      async (user) => {
        await this.processExpiredUser(user, currentDate);
      },
    );
  }

  private async processExpiredUser(
    user: User,
    currentDate: Date,
  ): Promise<void> {
    if (!user.subscriptionPaidThrough) {
      return;
    }

    const daysSinceExpiration = differenceInDays(
      currentDate,
      user.subscriptionPaidThrough,
    );

    if (daysSinceExpiration >= 1) {
      await this.prismaClient.user.update({
        where: { id: user.id },
        data: { plan: BillingPlan.FREE },
      });

      this.logger.info(
        'Updated user to FREE plan due to expired subscription',
        {
          userId: user.id,
          daysSinceExpiration,
        },
      );
    }
  }

  async addJob(
    data: SubscriptionCheckEvent = {},
  ): Promise<Job<SubscriptionCheckEvent>> {
    return expiredSubscriptionCheckQueue.add(data);
  }
}
