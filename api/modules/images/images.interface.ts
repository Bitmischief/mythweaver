import { Image } from '@prisma/client';

export interface PostImageRequest {
  modelId?: number;
  prompt: string;
  negativePrompt?: string;
  stylePreset?: ImageStylePreset;
  count?: number;
  seed?: string;
  linking?: {
    sessionId?: number;
    conjurationId?: number;
    characterId?: number;
  };
}

export interface PatchImageConjurationIdRequest {
  conjurationId: number;
}

export enum ImageStylePreset {
  FANTASY_ART = 'fantasy-art',
  DIGITAL_ART = 'digital-art',
  COMIC_BOOK = 'comic-book',
}

export interface GeneratedImage {
  uri: string;
  seed: number;
}

export interface ImageGenerationRequest {
  modelId?: number;
  userId: number;
  prompt: string;
  count: number;
  negativePrompt?: string;
  stylePreset?: ImageStylePreset;
  seed?: string;
  linking?: {
    sessionId?: number;
    conjurationId?: number;
    characterId?: number;
  };
  imageId?: number;
  forceImagePrimary?: boolean;
}

export interface GetUserImagesResponse {
  images: Image[];
  total: number;
}
