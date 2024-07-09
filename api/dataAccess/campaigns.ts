import { prisma } from '../lib/providers/prisma';
import { CampaignRole } from '../controllers/campaigns';
import { getClient } from '../lib/providers/openai';
import logger from '../lib/logger';
import { ContextType } from '@prisma/client';

const openai = getClient();

export interface ReindexCampaignContextEvent {
  type: ContextType;
  eventTargetId: number;
  campaignId: number;
}

export const getCampaign = async (campaignId: number) => {
  return initializeContextForCampaign(campaignId);
};

export const getCampaignContextConfig = async (campaignId: number) => {
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  return {
    assistantId: (campaign.openAiConfig as any).assistantId,
    threadId: (campaign.openAiConfig as any)?.threadId,
    vectorStoreId: (campaign.openAiConfig as any)?.vectorStoreId,
  };
};

export const createCampaign = async (request: {
  userId: number;
  name: string;
}) => {
  const campaign = await prisma.campaign.create({
    data: {
      name: request.name,
      description: '',
      rpgSystemCode: 'Dungeons & Dragons',
      userId: request.userId,
      members: {
        create: {
          userId: request.userId,
          role: CampaignRole.DM,
          joinedAt: new Date(),
        },
      },
    },
  });

  await initializeContextForCampaign(campaign.id);

  return campaign;
};

export const initializeContextForCampaign = async (campaignId: number) => {
  logger.info('Initializing context settings for campaign', { campaignId });

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
  let threadId = (campaign.openAiConfig as any)?.threadId;

  if (vectorStoreId && assistantId && threadId) {
    logger.info('Campaign already has open ai config set up');
    return campaign;
  }

  if (!vectorStoreId) {
    const vectorStore = await openai.beta.vectorStores.create({
      name: `campaign-${campaign.id}`,
    });

    vectorStoreId = vectorStore.id;
  }

  if (!assistantId) {
    const assistant = await openai.beta.assistants.create({
      instructions:
        "You are a helpful assistant who is creative and knowledgeable in table top role playing games. You are here to help the dungeon master run their campaign and generate creative, engaging content for their campaign. You have access to the campaign notes, sessions and actors within the campaign. Please deflect or refrain from answering any questions not related to the users' tabletop roleplaying game campaign.",
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId],
        },
      },
    });

    assistantId = assistant.id;
  }

  if (!threadId) {
    const thread = await openai.beta.threads.create();

    threadId = thread.id;
  }

  return prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      openAiConfig: {
        assistantId: assistantId,
        threadId: threadId,
        vectorStoreId: vectorStoreId,
      },
    },
  });
};
