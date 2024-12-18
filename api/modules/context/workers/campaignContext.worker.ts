import Queue, { Job } from 'bull';
import { Campaign, ContextType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/providers/prisma';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { getClient } from '@/lib/providers/openai';
import { MythWeaverLogger } from '@/lib/logger';
import fs from 'node:fs';
import { downloadFile, sleep } from '@/lib/utils';
import { config } from '@/modules/core/workers/worker.config';
import {
  WebSocketEvent,
  WebSocketProvider,
} from '@/providers/websocketProvider';
import { ReindexCampaignContextEvent } from '@/dataAccess/campaigns';
import { initializeContextForCampaign } from '@/dataAccess/campaigns';
import { Worker } from '@/modules/core/workers/worker.interface';

export const indexCampaignContextQueue = new Queue<ReindexCampaignContextEvent>(
  'index-campaign-context',
  config,
);

export class CampaignContextWorker implements Worker {
  private readonly openai = getClient();
  private readonly webSocketProvider = new WebSocketProvider();

  constructor(private readonly logger: MythWeaverLogger) {}

  async initializeWorker(): Promise<void> {
    indexCampaignContextQueue.process(
      async (job: Job<ReindexCampaignContextEvent>, done) => {
        this.logger.info('Processing index campaign context job', job.data);

        try {
          await this.indexCampaignContext(job.data);
          this.logger.info(
            'Completed processing index campaign context job',
            job.data,
          );
          done();
        } catch (err) {
          this.logger.error(
            'Error processing index campaign context job!',
            err,
          );
          done(new Error('Error processing index campaign context job!'));
        }
      },
    );

    this.logger.info('Campaign context worker initialized successfully');
  }

  private async indexCampaignContext(request: ReindexCampaignContextEvent) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: request.campaignId },
    });

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    await initializeContextForCampaign(campaign.id);

    switch (request.type) {
      case ContextType.CAMPAIGN:
        await this.updateCampaignContext(campaign, request);
        break;
      case ContextType.MANUAL_FILE_UPLOAD:
        await this.addManualFileToCampaignContext(campaign, request);
        break;
      case ContextType.SESSION:
        await this.updateSessionContext(
          campaign,
          request.eventTargetId,
          request,
        );
        break;
      case ContextType.CONJURATION:
        await this.updateConjurationContext(
          campaign,
          request.eventTargetId,
          request,
        );
        break;
    }
  }

  private async addManualFileToCampaignContext(
    campaign: Campaign,
    request: ReindexCampaignContextEvent,
  ) {
    if (!request.data?.fileUpload) {
      throw new AppError({
        description: 'No file upload data provided to manually index.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const internalFilename = `campaign-${campaign.id}-manual-${request.data.fileUpload.name}`;

    try {
      await downloadFile(request.data.fileUpload.uri, internalFilename);

      await this.indexFile(
        campaign,
        request.data.fileUpload.uri,
        request.data.fileUpload.name,
        internalFilename,
        request.type,
        {
          campaignId: campaign.id,
          type: request.type,
          uri: request.data.fileUpload.uri,
          filename: request.data?.fileUpload?.name,
        },
      );

      await this.webSocketProvider.sendMessage(
        campaign.userId,
        WebSocketEvent.CampaignFileProcessed,
        {
          campaignId: request.campaignId,
          filename: request.data.fileUpload.name,
        },
      );
    } catch (error) {
      this.logger.error('Error processing file upload', {
        campaignId: campaign.id,
        filename: request.data.fileUpload.name,
        error,
      });
      throw new AppError({
        description: 'Failed to process uploaded file.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    } finally {
      try {
        fs.unlinkSync(internalFilename);
      } catch (unlinkError) {
        /* empty */
      }
    }
  }

  private async updateSessionContext(
    campaign: Campaign,
    sessionId: number,
    request: ReindexCampaignContextEvent,
  ) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new AppError({
        description: 'Session not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const filename = `campaign-${campaign.id}-session-${sessionId}.json`;
    fs.writeFileSync(filename, JSON.stringify(session));

    await this.indexFile(
      campaign,
      filename,
      filename,
      filename,
      request.type,
      {
        campaignId: campaign.id,
        type: request.type,
        filename,
      },
      sessionId,
    );
  }

  private async updateConjurationContext(
    campaign: Campaign,
    conjurationId: number,
    request: ReindexCampaignContextEvent,
  ) {
    const conjuration = await prisma.conjuration.findUnique({
      where: { id: conjurationId },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const filename = `campaign-${campaign.id}-conjuration-${conjuration.id}.json`;
    fs.writeFileSync(filename, JSON.stringify(conjuration));

    await this.indexFile(
      campaign,
      filename,
      filename,
      filename,
      request.type,
      {
        campaignId: campaign.id,
        type: request.type,
        filename,
      },
      undefined,
      conjurationId,
    );
  }

  private async updateCampaignContext(
    campaign: Campaign,
    request: ReindexCampaignContextEvent,
  ) {
    const filename = `campaign-${campaign.id}.json`;
    fs.writeFileSync(filename, JSON.stringify(campaign));

    await this.indexFile(campaign, filename, filename, filename, request.type, {
      campaignId: campaign.id,
      type: ContextType.CAMPAIGN,
    });
  }

  private async indexFile(
    campaign: Campaign,
    fileUri: string,
    filename: string,
    internalFilename: string,
    type: ContextType,
    contextFileQuery: Prisma.ContextFilesWhereInput,
    sessionId?: number,
    conjurationId?: number,
  ) {
    const existingContextFile = await prisma.contextFiles.findFirst({
      where: contextFileQuery,
    });

    if (existingContextFile) {
      await this.openai.files.del(existingContextFile.externalSystemFileId);
      await prisma.contextFiles.delete({
        where: { id: existingContextFile.id },
      });
    }

    const file = await this.openai.files.create({
      file: fs.createReadStream(internalFilename),
      purpose: 'assistants',
    });

    await sleep(250);
    fs.unlinkSync(internalFilename);

    await this.openai.beta.vectorStores.files.createAndPoll(
      (campaign.openAiConfig as any)?.vectorStoreId,
      { file_id: file.id },
    );

    await prisma.contextFiles.create({
      data: {
        campaignId: campaign.id,
        externalSystemFileId: file.id,
        type,
        filename,
        uri: fileUri,
        sessionId,
        conjurationId,
      },
    });
  }

  async addJob(
    data: ReindexCampaignContextEvent,
  ): Promise<Job<ReindexCampaignContextEvent>> {
    return indexCampaignContextQueue.add(data);
  }

  async shutdown(): Promise<void> {
    await indexCampaignContextQueue.close();
  }
}
