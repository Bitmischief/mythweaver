export interface Image {
  id: number;
  uri: string;
  generating: boolean;
  createdAt: string;
  modelId: number;
  modelName: string;
  prompt: string;
  edits: any;
  conjurationId?: number;
  sessionId?: number;
  characterId?: number;
  error?: boolean;
  errorMessage?: string;
}
