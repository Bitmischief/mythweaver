import {
  initializeContextForCampaign,
  ReindexCampaignContextEvent,
} from '../../dataAccess/campaigns';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { getClient } from '../../lib/providers/openai';
import { Campaign, ContextType } from '@prisma/client';
import logger from '../../lib/logger';
import fs from 'node:fs';

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
  } else if (request.type === ContextType.MANUAL_FILE_UPLOAD) {
    await addManualFileToCampaignContext(campaign, request);
  }
};

const addManualFileToCampaignContext = async (
  campaign: Campaign,
  request: ReindexCampaignContextEvent,
) => {
  if (!request.data?.fileUpload) {
    throw new AppError({
      description: 'No file upload data provided to manually index.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const existingContextFile = await prisma.contextFiles.findFirst({
    where: {
      campaignId: campaign.id,
      type: ContextType.MANUAL_FILE_UPLOAD,
      filename: request.data?.fileUpload?.name,
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
  const filename = `campaign-${campaign.id}-manual-${request.data.fileUpload.name}.json`;
  fs.writeFileSync(filename, JSON.stringify(campaign));

  const file = await openai.files.create({
    file: fs.createReadStream(filename),
    purpose: 'assistants',
  });
  fs.unlinkSync(filename);

  await openai.beta.vectorStores.files.createAndPoll(
    (campaign.openAiConfig as any)?.vectorStoreId,
    { file_id: file.id },
  );

  await prisma.contextFiles.create({
    data: {
      campaignId: campaign.id,
      externalSystemFileId: file.id,
      type: ContextType.CAMPAIGN,
      filename: request.data.fileUpload.name,
    },
  });
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
  const filename = `campaign-${campaign.id}.json`;
  fs.writeFileSync(filename, JSON.stringify(campaign));

  const file = await openai.files.create({
    file: fs.createReadStream(filename),
    purpose: 'assistants',
  });
  fs.unlinkSync(filename);

  await openai.beta.vectorStores.files.createAndPoll(
    (campaign.openAiConfig as any)?.vectorStoreId,
    { file_id: file.id },
  );

  await prisma.contextFiles.create({
    data: {
      campaignId: campaign.id,
      externalSystemFileId: file.id,
      type: ContextType.CAMPAIGN,
      filename,
    },
  });
};
