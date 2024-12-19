import { AppError } from '@/modules/core/errors/AppError';
import { HttpCode } from '@/modules/core/errors/AppError';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';
import { ContextService } from '@/modules/context/context.service';

export class OpenAIProvider {
  private openai;

  constructor(
    private readonly campaignDataProvider: CampaignsDataProvider,
    private readonly contextService: ContextService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  createVectorStore(name: string) {
    return this.openai.beta.vectorStores.create({
      name,
    });
  }

  createAssistant(vectorStoreId: string) {
    return this.openai.beta.assistants.create({
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
  }

  deleteFile(fileId: string) {
    return this.openai.files.del(fileId);
  }

  createThread() {
    return this.openai.beta.threads.create();
  }

  async generateText(campaignId: number, prompt: string): Promise<string> {
    const campaign = await this.campaignDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const { assistantId } =
      await this.contextService.getCampaignContextConfig(campaignId);

    const thread = await this.openai.beta.threads.create();

    await this.openai.beta.threads.messages.create(thread.id, {
      content: prompt,
      role: 'user',
    });

    const run = await this.openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistantId,
    });

    const messages = await this.openai.beta.threads.messages.list(thread.id, {
      run_id: run.id,
    });

    const response = messages.data.pop();
    return (response?.content[0] as TextContentBlock)?.text?.value || '';
  }
}
