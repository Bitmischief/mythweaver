import Queue from 'bull';
import {
  initializeContextForCampaign,
  ReindexCampaignContextEvent,
} from '@/dataAccess/campaigns';
import { prisma } from '@/lib/providers/prisma';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { getClient } from '@/lib/providers/openai';
import { Campaign, ContextType, Prisma } from '@prisma/client';
import logger from '@/lib/logger';
import fs from 'node:fs';
import { downloadFile, sleep } from '@/lib/utils';
import { config } from '@/worker/config';
import {
  WebSocketEvent,
  WebSocketProvider,
} from '@/providers/websocketProvider';

const openai = getClient();
const webSocketProvider = new WebSocketProvider();
export const indexCampaignContextQueue = new Queue<ReindexCampaignContextEvent>(
  'index-campaign-context',
  config,
);

indexCampaignContextQueue.process(async (job, done) => {
  logger.info('Processing index campaign context job', job.data);

  try {
    await indexCampaignContext(job.data);
    logger.info('Completed processing index campaign context job', job.data);
    done();
  } catch (err) {
    logger.error('Error processing index campaign context job!', err);
    done(new Error('Error processing index campaign context job!'));
  }
});

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
  } else if (request.type === ContextType.CONJURATION) {
    await updateConjurationContext(campaign, request.eventTargetId, request);
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

  logger.info('Creating and uploading new manual upload context file');
  const internalFilename = `campaign-${campaign.id}-manual-${request.data.fileUpload.name}`;

  try {
    await downloadFile(request.data.fileUpload.uri, internalFilename);

    await indexFile(
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

    await webSocketProvider.sendMessage(
      campaign.userId,
      WebSocketEvent.CampaignFileProcessed,
      {
        campaignId: request.campaignId,
        filename: request.data.fileUpload.name,
      },
    );
  } catch (error) {
    logger.error(
      'Error processing file upload',
      {
        campaignId: campaign.id,
        filename: request.data.fileUpload.name,
        error,
      },
      error,
    );
    throw new AppError({
      description: 'Failed to process uploaded file.',
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  } finally {
    // Clean up the downloaded file if it exists
    try {
      fs.unlinkSync(internalFilename);
    } catch (unlinkError) {
      // Ignore errors if the file doesn't exist
    }
  }
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

  if (!session) {
    throw new AppError({
      description: 'Session not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const filename = `campaign-${campaign.id}-session-${sessionId}.json`;
  fs.writeFileSync(filename, JSON.stringify(session));

  await indexFile(
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
};

const updateConjurationContext = async (
  campaign: Campaign,
  conjurationId: number,
  request: ReindexCampaignContextEvent,
) => {
  logger.info('Creating and uploading new session context file');

  const conjuration = await prisma.conjuration.findUnique({
    where: {
      id: conjurationId,
    },
  });

  if (!conjuration) {
    throw new AppError({
      description: 'Conjuration not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const filename = `campaign-${campaign.id}-conjuration-${conjuration.id}.json`;
  fs.writeFileSync(filename, JSON.stringify(conjuration));

  await indexFile(
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
};

const updateCampaignContext = async (
  campaign: Campaign,
  request: ReindexCampaignContextEvent,
) => {
  logger.info('Creating and uploading new context file');
  const filename = `campaign-${campaign.id}.json`;
  fs.writeFileSync(filename, JSON.stringify(campaign));

  await indexFile(campaign, filename, filename, filename, request.type, {
    campaignId: campaign.id,
    type: ContextType.CAMPAIGN,
  });
};

const indexFile = async (
  campaign: Campaign,
  fileUri: string,
  filename: string,
  internalFilename: string,
  type: ContextType,
  contextFileQuery: Prisma.ContextFilesWhereInput,
  sessionId: number | undefined = undefined,
  conjurationId: number | undefined = undefined,
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
    file: fs.createReadStream(internalFilename),
    purpose: 'assistants',
  });

  await sleep(250);
  fs.unlinkSync(internalFilename);

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
      sessionId,
      conjurationId,
    },
  });
};
