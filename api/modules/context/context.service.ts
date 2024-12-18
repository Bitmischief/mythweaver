import { AppError, HttpCode } from '@/lib/errors/AppError';
import { prisma } from '@/lib/providers/prisma';
import { ContextType } from '@prisma/client';
import { CampaignContextWorker } from './workers/campaignContext.worker';
import { getClient } from '@/lib/providers/openai';

const openai = getClient();

export interface IndexContextTarget {
  sessionId?: number;
  conjurationId?: number;
  campaignId?: number;
}

export class ContextService {
  constructor(private indexCampaignContextWorker: CampaignContextWorker) {}

  indexContext = async (campaignId: number, target: IndexContextTarget) => {
    await this.indexCampaignContextWorker.addJob({
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

    await openai.files.del(contextFile.externalSystemFileId);

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
