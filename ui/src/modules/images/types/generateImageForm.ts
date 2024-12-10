import { SelectedModelInput } from './selectedModelInput';

export interface GenerateImageForm {
  selectedModels: SelectedModelInput[];
  prompt: string;
  aspectRatio: string;
  referenceImageFile?: File;
  referenceImageStrength?: number;
  linking?: {
    conjurationId?: number;
    sessionId?: number;
    characterId?: number;
  };
}
