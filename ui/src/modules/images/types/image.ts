export interface Image {
  id: number;
  uri?: string;
  generating: boolean;
  modelId: number;
  modelName?: string;
  prompt: string;
  edits: any;
  conjurationId?: number;
  sessionId?: number;
  characterId?: number;
  error?: boolean;
  failed?: boolean;
  errorMessage?: string;
  createdAt?: string;
  imageModel?: {
    description: string;
    id: number;
  };
  status?: string;
}
