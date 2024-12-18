import { getCampaign } from '@/dataAccess/campaigns';
import { AppError } from '@/lib/errors/AppError';
import { getCampaignContextConfig } from '@/dataAccess/campaigns';
import { HttpCode } from '@/lib/errors/AppError';
import { getClient } from '@/lib/providers/openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';

export class OpenAIProvider {
  private openai;

  constructor() {
    this.openai = getClient();
  }

  async generateText(campaignId: number, prompt: string): Promise<string> {
    const campaign = await getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const contextConfig = await getCampaignContextConfig(campaignId);

    const thread = await this.openai.beta.threads.create();

    await this.openai.beta.threads.messages.create(thread.id, {
      content: prompt,
      role: 'user',
    });

    const run = await this.openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: contextConfig.assistantId,
    });

    const messages = await this.openai.beta.threads.messages.list(thread.id, {
      run_id: run.id,
    });

    const response = messages.data.pop();
    return (response?.content[0] as TextContentBlock)?.text?.value || '';
  }
}
