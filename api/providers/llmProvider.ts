import { OpenAIProvider } from './llms/openAIProvider';

export interface LLMProvider {
  generateText(campaignId: number, prompt: string): Promise<string>;
}

export const defaultLLMProvider = new OpenAIProvider() as LLMProvider;
