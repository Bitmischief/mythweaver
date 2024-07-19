import {
  initializeContextForCampaign,
  ReindexCampaignContextEvent,
} from '../../dataAccess/campaigns';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { getClient } from '../../lib/providers/openai';
import { Campaign, ContextType, Prisma } from '@prisma/client';
import logger from '../../lib/logger';
import fs from 'node:fs';
import { downloadFile } from '../../lib/utils';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';

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
    await updateCampaignContext(campaign, request);
  } else if (request.type === ContextType.MANUAL_FILE_UPLOAD) {
    await addManualFileToCampaignContext(campaign, request);
  } else if (request.type === ContextType.SESSION) {
    await updateSessionContext(campaign, request.eventTargetId, request);
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

  logger.info('Creating and uploading new context file');
  const fileUri = `campaign-${campaign.id}-manual-${request.data.fileUpload.name}`;

  await downloadFile(request.data.fileUpload.uri, fileUri);

  await indexFile(
    campaign,
    request.data.fileUpload.uri,
    request.data.fileUpload.name,
    request.type,
    {
      campaignId: campaign.id,
      type: request.type,
      uri: request.data.fileUpload.uri,
      filename: request.data?.fileUpload?.name,
    },
  );

  await sendWebsocketMessage(
    campaign.userId,
    WebSocketEvent.CampaignFileProcessed,
    {
      campaignId: request.campaignId,
      filename: request.data.fileUpload.name,
    },
  );
};

const updateSessionContext = async (
  campaign: Campaign,
  sessionId: number,
  request: ReindexCampaignContextEvent,
) => {
  logger.info('Creating and uploading new session context file');

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
  });

  const filename = `campaign-${campaign.id}-session-${sessionId}.json`;
  fs.writeFileSync(filename, JSON.stringify(session));

  await indexFile(campaign, filename, filename, request.type, {
    campaignId: campaign.id,
    type: request.type,
    filename,
  });
};

const updateCampaignContext = async (
  campaign: Campaign,
  request: ReindexCampaignContextEvent,
) => {
  logger.info('Creating and uploading new context file');
  const filename = `campaign-${campaign.id}.json`;
  fs.writeFileSync(filename, JSON.stringify(campaign));

  await indexFile(campaign, filename, filename, request.type, {
    campaignId: campaign.id,
    type: ContextType.CAMPAIGN,
  });
};

const indexFile = async (
  campaign: Campaign,
  fileUri: string,
  filename: string,
  type: ContextType,
  contextFileQuery: Prisma.ContextFilesWhereInput,
) => {
  const existingContextFile = await prisma.contextFiles.findFirst({
    where: contextFileQuery,
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
      type,
      filename,
      uri: fileUri,
    },
  });
};
