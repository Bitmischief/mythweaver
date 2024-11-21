export interface Image {
  id: number;
  uri: string;
  generating: boolean;
  createdAt: string;
  modelId: number;
  prompt: string;
  edits: any;
}
