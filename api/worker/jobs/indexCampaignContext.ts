import {
  initializeContextForCampaign,
  ReindexCampaignContextEvent,
} from '../../dataAccess/campaigns';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { getClient } from '../../lib/providers/openai';
import { toFile } from 'openai';
import { Campaign, ContextType } from '@prisma/client';
import logger from '../../lib/logger';

const openai = getClient();

export const indexCampaignContext = async (
  request: ReindexCampaignContextEvent,
) => {
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: request.campaignId,
    },
  });

  if (!campaign) {
    throw new AppError({
      description: 'Campaign not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  await initializeContextForCampaign(campaign.id);

  if (request.type === ContextType.CAMPAIGN) {
    await updateCampaignContext(campaign);
  }
};

const updateCampaignContext = async (campaign: Campaign) => {
  const existingContextFile = await prisma.contextFiles.findFirst({
    where: {
      campaignId: campaign.id,
      type: ContextType.CAMPAIGN,
    },
  });

  if (existingContextFile) {
    logger.info('Deleting existing context file', {
      fileId: existingContextFile.externalSystemFileId,
    });
    await openai.files.del(existingContextFile.externalSystemFileId);
    await prisma.contextFiles.delete({
      where: {
        id: existingContextFile.id,
      },
    });
  }

  logger.info('Creating and uploading new context file');
  const file = await openai.files.create({
    file: await toFile(
      new Blob([JSON.stringify(campaign)]),
      `campaign-${campaign.id}.json`,
    ),
    purpose: 'assistants',
  });

  await prisma.contextFiles.create({
    data: {
      campaignId: campaign.id,
      externalSystemFileId: file.id,
      type: ContextType.CAMPAIGN,
    },
  });
};
