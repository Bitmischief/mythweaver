import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { prisma } from '@/providers/prisma';
import { ContextType } from '@prisma/client';
import { Logger } from '@/modules/core/logging/logger';
import { LLMProvider } from '@/providers/llmProvider';
import { Queue } from 'bull';
import { ReindexCampaignContextEvent } from './context.interface';
export interface IndexContextTarget {
  sessionId?: number;
  conjurationId?: number;
  campaignId?: number;
}

export class ContextService {
  constructor(
    private indexCampaignContextQueue: Queue<ReindexCampaignContextEvent>,
    private logger: Logger,
    private llmProvider: LLMProvider,
  ) {}

  async initCampaignContext(campaignId: number) {
    this.logger.info('Initializing context settings for campaign', {
      campaignId,
    });

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    let vectorStoreId = (campaign.openAiConfig as any)?.vectorStoreId;
    let assistantId = (campaign.openAiConfig as any)?.assistantId;

    if (vectorStoreId && assistantId) {
      this.logger.info('Campaign already has open ai config set up');
      return campaign;
    }

    if (!vectorStoreId) {
      const vectorStore = await this.llmProvider.createVectorStore(
        `campaign-${campaign.id}`,
      );
      vectorStoreId = vectorStore.id;
    }

    if (!assistantId) {
      const assistant = await this.llmProvider.createAssistant(vectorStoreId);
      assistantId = assistant.id;
    }

    return prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        openAiConfig: {
          assistantId: assistantId,
          vectorStoreId: vectorStoreId,
        },
      },
    });
  }

  indexContext = async (campaignId: number, target: IndexContextTarget) => {
    await this.indexCampaignContextQueue.add({
      campaignId,
      ...this.getTypeAndTargetId(target),
    });
  };

  deleteContext = async (campaignId: number, target: IndexContextTarget) => {
    const { type } = this.getTypeAndTargetId(target);

    const contextFile = await prisma.contextFiles.findFirst({
      where: {
        type,
        campaignId: campaignId,
        ...(target.sessionId && { sessionId: target.sessionId }),
        ...(target.conjurationId && { conjurationId: target.conjurationId }),
        ...(target.campaignId && { campaignId: target.campaignId }),
      },
    });

    if (!contextFile) {
      throw new AppError({
        description: 'File not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await this.llmProvider.deleteFile(contextFile.externalSystemFileId);

    await prisma.contextFiles.delete({
      where: {
        id: contextFile.id,
      },
    });
  };

  getTypeAndTargetId = (target: IndexContextTarget) => {
    if (target.sessionId) {
      return { type: ContextType.SESSION, eventTargetId: target.sessionId };
    } else if (target.conjurationId) {
      return {
        type: ContextType.CONJURATION,
        eventTargetId: target.conjurationId,
      };
    } else if (target.campaignId) {
      return { type: ContextType.CAMPAIGN, eventTargetId: target.campaignId };
    }

    throw new AppError({
      description: 'Invalid context target provided.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  };
}
