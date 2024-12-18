import { indexCampaignContextQueue } from '@/worker';
import { ContextType } from '@prisma/client';
import { prisma } from '@/lib/providers/prisma';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { getClient } from '@/lib/providers/openai';

const openai = getClient();

export const indexConjurationContext = async (
  campaignId: number,
  conjurationId: number,
) => {
  await indexCampaignContextQueue.add({
    campaignId: campaignId,
    eventTargetId: conjurationId,
    type: ContextType.CONJURATION,
  });
};

export const deleteConjurationContext = async (
  campaignId: number,
  conjurationId: number,
) => {
  const contextFile = await prisma.contextFiles.findFirst({
    where: {
      type: ContextType.CONJURATION,
      campaignId,
      conjurationId,
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
