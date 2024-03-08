import {
  Body,
  Inject,
  OperationId,
  Patch,
  Post,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { TrackingInfo } from '../lib/tracking';
import { generateImage } from '../services/imageGeneration';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { MythWeaverLogger } from '../lib/logger';

interface PostImageRequest {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: ImageStylePreset;
  count?: number;
}

interface PatchImageConjurationIdRequest {
  conjurationId: number;
}

export enum ImageStylePreset {
  FANTASY_ART = 'fantasy-art',
  DIGITAL_ART = 'digital-art',
  COMIC_BOOK = 'comic-book',
}

@Route('images')
@Tags('Images')
export default class ImageController {
  @Security('jwt')
  @OperationId('generateImage')
  @Post('/')
  public async postImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostImageRequest,
  ): Promise<void> {
    let count = 3;
    if (request.count) {
      count = request.count;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (!user.earlyAccessExempt) {
      if (user.imageCredits < count) {
        throw new AppError({
          description:
            'You do not have enough image credits to generate this many images. Please try with fewer images, or buy more credits.',
          httpCode: HttpCode.BAD_REQUEST,
        });
      }
    }

    generateImage({
      userId,
      prompt: request.prompt,
      count,
      negativePrompt: request.negativePrompt,
      stylePreset: request.stylePreset,
    });
  }

  @Security('jwt')
  @OperationId('setConjurationId')
  @Patch('/:imageId/conjurationId')
  public async patchImageConjurationId(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() imageId: number,
    @Body() request: PatchImageConjurationIdRequest,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await prisma.image.findUnique({
      where: {
        id: imageId,
        userId: userId,
      },
    });

    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    await prisma.image.update({
      where: {
        id: imageId,
      },
      data: {
        conjurationId: request.conjurationId,
      },
    });
  }
}
