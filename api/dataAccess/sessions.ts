import { indexCampaignContextQueue } from '../worker';
import { ContextType } from '@prisma/client';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { getClient } from '../lib/providers/openai';

const openai = getClient();

export interface TranscribeSessionEvent {
  sessionId: number;
  userId: number;
}

export const indexSessionContext = async (
  campaignId: number,
  sessionId: number,
) => {
  await indexCampaignContextQueue.add({
    campaignId: campaignId,
    eventTargetId: sessionId,
    type: ContextType.SESSION,
  });
};

export const deleteSessionContext = async (
  campaignId: number,
  sessionId: number,
) => {
  const contextFile = await prisma.contextFiles.findFirst({
    where: {
      type: ContextType.SESSION,
      campaignId: campaignId,
      sessionId: sessionId,
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
