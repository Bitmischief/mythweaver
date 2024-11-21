import { SelectedModelInput } from './selectedModelInput';

export interface GenerateImageRequest {
  selectedModels: SelectedModelInput[];
  prompt: string;
  negativePrompt?: string;
  referenceImageFile?: File;
  width: number;
  height: number;
  referenceImageStrength?: number;
  linking?: {
    conjurationId?: number;
    sessionId?: number;
    characterId?: number;
  };
}
