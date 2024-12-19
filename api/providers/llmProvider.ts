export interface LLMProvider {
  generateText(campaignId: number, prompt: string): Promise<string>;
}
