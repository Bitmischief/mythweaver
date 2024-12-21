import OpenAI from 'openai';

export interface LLMProvider {
  generateText(campaignId: number, prompt: string): Promise<string>;
  deleteFile(fileId: string): Promise<void>;
  createFile(filepath: string): Promise<OpenAI.Files.FileObject>;
  addFileToVectorStore(
    vectorStoreId: string,
    fileId: string,
  ): Promise<OpenAI.Beta.VectorStores.Files.VectorStoreFile>;
  createAssistant(
    vectorStoreId: string,
  ): Promise<OpenAI.Beta.Assistants.Assistant>;
  createVectorStore(
    name: string,
  ): Promise<OpenAI.Beta.VectorStores.VectorStore>;
}
