import Queue, { Job } from 'bull';
import { prisma } from '@/lib/providers/prisma';
import { BillingPlan, User } from '@prisma/client';
import { MythWeaverLogger } from '@/lib/logger';
import { config } from '@/worker/config';

interface EndTrialEvent {
  batchSize?: number;
}

const DEFAULT_BATCH_SIZE = 10;

export const endTrialQueue = new Queue<EndTrialEvent>('end-trial', config, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export class EndTrialWorker {
  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly prismaClient = prisma,
  ) {}

  async initializeWorker(): Promise<void> {
    endTrialQueue.process(async (job: Job<EndTrialEvent>) => {
      this.logger.info('Processing end trial job', {
        jobId: job.id,
        data: job.data,
      });

      try {
        await this.processEndTrials(job.data.batchSize || DEFAULT_BATCH_SIZE);
        this.logger.info('Completed processing end trials job');
      } catch (err) {
        this.logger.error('Error processing end trials job', {
          jobId: job.id,
          error: err,
        });
        throw new Error('Error processing end trials job');
      }
    });

    endTrialQueue.on('failed', (job: Job<EndTrialEvent>, err: Error) => {
      this.logger.error('End trial job failed', {
        jobId: job.id,
        data: job.data,
        error: err,
      });
    });

    await this.scheduleWorker();

    this.logger.info('End trial worker initialized successfully');
  }

  private async scheduleWorker(): Promise<void> {
    const endTrialsJobId = 'every-minute-end-trial-job';

    const endTrialsJob = await endTrialQueue.getRepeatableJobs();

    if (endTrialsJob.some((job) => job.id === endTrialsJobId)) {
      this.logger.info('End trial job already scheduled');
      return;
    }

    await endTrialQueue.add(
      {},
      {
        repeat: { cron: '* * * * *' },
        jobId: endTrialsJobId,
      },
    );

    this.logger.info('End trial job scheduled');
  }

  private async processEndTrials(batchSize: number): Promise<void> {
    let skip = 0;
    let users: User[] = [];

    do {
      users = await this.prismaClient.user.findMany({
        where: {
          trialEndsAt: {
            lte: new Date(),
          },
        },
        skip,
        take: batchSize,
      });

      this.logger.info(`Processing batch of users`, {
        count: users.length,
        skip,
        batchSize,
      });

      for (const user of users) {
        await this.endUserTrial(user);
      }

      skip += users.length;
    } while (users.length === batchSize);
  }

  private async endUserTrial(user: User): Promise<void> {
    this.logger.info(`Ending trial for user`, {
      userId: user.id,
      email: user.email,
    });

    await this.prismaClient.user.update({
      where: {
        id: user.id,
      },
      data: {
        trialEndsAt: null,
        plan: BillingPlan.FREE,
      },
    });
  }

  async addJob(data: EndTrialEvent = {}): Promise<Job<EndTrialEvent>> {
    return endTrialQueue.add(data);
  }

  async shutdown(): Promise<void> {
    await endTrialQueue.close();
  }
}
