export interface ImageModelResponse {
  data: ImageModel[];
}

export interface ImageModel {
  id: number;
  description: string;
  strengths: string[];
  promptPrefix: string | null;
  sampleImageUris: string[];
  defaultSteps: number;
  licensedArt: boolean;
  default: boolean;
}