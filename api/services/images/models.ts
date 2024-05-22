import { ImageStylePreset } from '../../controllers/images';

export interface ImageGenerationRequest {
  modelId?: number;
  userId: number;
  prompt: string;
  count: number;
  negativePrompt?: string;
  stylePreset?: ImageStylePreset;
  linking?: {
    sessionId?: number;
    conjurationId?: number;
    characterId?: number;
  };
  seed?: string;
  forceImagePrimary?: boolean;
}

export interface ImageGenerationResponse {
  images: Array<GeneratedImage>;
}

export interface GeneratedImage {
  uri: string;
  seed: number;
}

export interface ImageUpscaleRequest {
  imageId: number;
  userId: number;
  imageUri: string;
}

export interface ImageUpscaleResponse {
  artifacts: Array<{
    base64: string;
    finishReason: string;
    seed: number;
  }>;
}
