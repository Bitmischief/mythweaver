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
  aspectRatio?: AspectRatio;
  imageId?: number;
  referenceImage?: Express.Multer.File;
  imageStrength?: number;
}

export interface PatchImageConjurationIdRequest {
  conjurationId: number;
}

export enum ImageStylePreset {
  FANTASY_ART = 'fantasy-art',
  DIGITAL_ART = 'digital-art',
  COMIC_BOOK = 'comic-book',
}

export interface ApiImageGenerationResponse {
  base64: string;
  nsfw: boolean;
  seed: number;
}

export interface GeneratedImage {
  uri: string;
  nsfw: boolean;
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
  forceImagePrimary?: boolean;
  // Remove aspectRatio and add width and height
  width?: number;
  height?: number;
  referenceImage?: Buffer;
  imageStrength?: number;
}

export interface GetUserImagesResponse {
  images: Image[];
  total: number;
}

export interface ImageEditRequest {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
}

export interface ImageOutpaintRequest {
  left: number;
  right: number;
  up: number;
  down: number;
  prompt?: string;
  creativity?: number;
  seed?: number;
}

export interface ImageEdit {
  id: string;
  dateCreated: string;
  type: ImageEditType;
  uri: string;
}

export enum ImageEditType {
  ORIGINAL = 'original',
  SMART_ERASE = 'smart_erase',
  INPAINTING = 'inpainting',
  OUTPAINTING = 'outpainting',
  BACKGROUND_REMOVAL = 'background_removal',
  REVERT = 'revert',
}

export type AspectRatio =
  | '1:1'
  | '9:7'
  | '3:2'
  | '7:4'
  | '12:5'
  | '5:12'
  | '4:7'
  | '2:3'
  | '7:9';

export interface GenerateImageOptions {
  aspectRatio?: AspectRatio;
}

export interface ImageUpscaleRequest {
  userId: number;
  imageId: number;
  imageUri: string;
}
