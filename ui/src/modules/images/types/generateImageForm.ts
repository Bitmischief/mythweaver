import { SelectedModelInput } from "./selectedModelInput";
import { FormKitFile } from '@formkit/inputs';

export interface GenerateImageForm {
  selectedModels: SelectedModelInput[];
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  referenceImageFile?: FormKitFile;
  referenceImageStrength?: number;
}