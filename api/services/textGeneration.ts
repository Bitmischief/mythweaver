import { TextContentBlock } from 'openai/resources/beta/threads';
import { getCampaign, getCampaignContextConfig } from '../dataAccess/campaigns';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { getClient } from '../lib/providers/openai';

const openai = getClient();

export const generateText = async (campaignId: number, prompt: string) => {
  const campaign = await getCampaign(campaignId);

  if (!campaign) {
    throw new AppError({
      description: 'Campaign not found.',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  const contextConfig = await getCampaignContextConfig(campaignId);

  const thread = await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    content: prompt,
    role: 'assistant',
  });

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: contextConfig.assistantId,
  });

  const messages = await openai.beta.threads.messages.list(thread.id, {
    run_id: run.id,
  });

  const response = messages.data.pop();
  return (response?.content[0] as TextContentBlock)?.text?.value || '';
};
