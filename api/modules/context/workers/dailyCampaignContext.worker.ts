import Queue, { Job } from 'bull';
import { Campaign, Conjuration, ContextType, Session } from '@prisma/client';
import { prisma } from '@/lib/providers/prisma';
import { ContextService } from '@/modules/context/context.service';
import { processInChunks } from '@/lib/utils';
import { MythWeaverLogger } from '@/lib/logger';
import { config } from '@/worker/config';

interface CampaignContextEvent {
  forceSync?: boolean;
}

export const dailyCampaignContextQueue = new Queue<CampaignContextEvent>(
  'campaign-context-sync',
  config,
);

export class DailyCampaignContextWorker {
  constructor(
    private readonly logger: MythWeaverLogger,
    private contextService: ContextService,
  ) {}

  async initializeWorker(): Promise<void> {
    dailyCampaignContextQueue.process(
      async (job: Job<CampaignContextEvent>, done) => {
        this.logger.info('Processing daily campaign context sync queue job', {
          jobId: job.id,
          data: job.data,
        });

        try {
          await this.processDailyCampaignContextSync();
          this.logger.info(
            'Completed processing daily campaign context sync queue job',
            {
              jobId: job.id,
              data: job.data,
            },
          );
          done();
        } catch (err) {
          this.logger.error(
            'Error processing daily campaign context sync queue job!',
            {
              jobId: job.id,
              data: job.data,
              error: err,
            },
          );
          done(
            new Error(
              'Error processing daily campaign context sync queue job!',
            ),
          );
        }
      },
    );

    await this.scheduleDailyCampaignContextJob();

    this.logger.info('Daily campaign context worker initialized successfully');
  }

  private async scheduleDailyCampaignContextJob(): Promise<void> {
    const dailyContextJobId = 'daily-context-job';

    const existingDailyContextJob =
      await dailyCampaignContextQueue.getRepeatableJobs();

    if (existingDailyContextJob.some((job) => job.id === dailyContextJobId)) {
      this.logger.info('Daily campaign context job already scheduled');
      return;
    }

    await dailyCampaignContextQueue.add(
      {},
      {
        repeat: { cron: '0 7 * * *' },
        jobId: dailyContextJobId,
      },
    );

    this.logger.info('Daily campaign context job scheduled');
  }

  private async processDailyCampaignContextSync(): Promise<void> {
    await processInChunks<Campaign>(
      5,
      (skip, take) =>
        prisma.campaign.findMany({
          orderBy: { id: 'asc' },
          skip,
          take,
        }),
      async (campaign) => {
        this.logger.info(`Indexing campaign ${campaign.id}`);
        await this.contextService.indexContext(campaign.id, {
          campaignId: campaign.id,
        });

        await this.processSessionsForCampaign(campaign);
        await this.processConjurationsForCampaign(campaign);
      },
    );
  }

  private async processSessionsForCampaign(campaign: Campaign): Promise<void> {
    await processInChunks<Session>(
      5,
      (skip, take) =>
        prisma.session.findMany({
          where: { campaignId: campaign.id },
          orderBy: { id: 'asc' },
          skip,
          take,
        }),
      async (session) => {
        this.logger.info(
          `Indexing session ${session.id} for campaign ${campaign.id}`,
        );
        await this.contextService.indexContext(campaign.id, {
          sessionId: session.id,
        });
      },
    );
  }

  private async processConjurationsForCampaign(
    campaign: Campaign,
  ): Promise<void> {
    await processInChunks<Conjuration>(
      5,
      (skip, take) =>
        prisma.conjuration.findMany({
          where: {
            campaignConjuration: {
              some: { campaignId: campaign.id },
            },
          },
          orderBy: { id: 'asc' },
          skip,
          take,
        }),
      async (conjuration) => {
        this.logger.info(
          `Indexing conjuration ${conjuration.id} for campaign ${campaign.id}`,
        );
        await this.contextService.indexContext(campaign.id, {
          conjurationId: conjuration.id,
        });
      },
    );
  }

  async addJob(data: CampaignContextEvent): Promise<Job<CampaignContextEvent>> {
    return dailyCampaignContextQueue.add(data);
  }

  async shutdown(): Promise<void> {
    await dailyCampaignContextQueue.close();
  }
}
