import { SelectedModelInput } from './selectedModelInput';

export interface GenerateImageRequest {
  selectedModels: SelectedModelInput[];
  prompt: string;
  negativePrompt?: string;
  referenceImageFile?: File;
  width: number;
  height: number;
  referenceImageStrength?: number;
}
