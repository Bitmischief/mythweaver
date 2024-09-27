import {
  Body,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { TrackingInfo } from '../lib/tracking';
import { generateImage } from '../services/images/imageGeneration';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { MythWeaverLogger } from '../lib/logger';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';
import { upscaleImage } from '../services/images/upscalingService';
import { Image } from '@prisma/client';

interface PostImageRequest {
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

    if (user.imageCredits < count) {
      throw new AppError({
        description:
          'You do not have enough image credits to generate this many images. Please try with fewer images, or buy more credits.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      generateImage({
        modelId: request.modelId,
        userId,
        prompt: request.prompt,
        count,
        negativePrompt: request.negativePrompt,
        stylePreset: request.stylePreset,
        seed: request.seed,
        linking: request.linking,
      });
    } catch (error) {
      logger.error('Error generating image', {}, error);
    }
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

  @Security('jwt')
  @OperationId('upscaleImage')
  @Post('/:imageId/upscale')
  public async postImageUpscale(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() imageId: number,
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

    if (!image.uri) {
      throw new AppError({
        description: 'Image does not have a URI.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (user.imageCredits < 1) {
      throw new AppError({
        description:
          'You do not have enough image credits to upscale this image.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    upscaleImage(userId, imageId);
  }

  @Security('jwt')
  @OperationId('setPrimary')
  @Patch('/:imageId/primary')
  public async patchPrimaryImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() imageId: number,
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

    await prisma.image.updateMany({
      where: {
        userId: userId,
        conjurationId: image.conjurationId,
        sessionId: image.sessionId,
        characterId: image.characterId,
      },
      data: {
        primary: false,
      },
    });

    await prisma.image.update({
      where: {
        id: imageId,
      },
      data: {
        primary: true,
      },
    });

    const updatedImages = await prisma.image.findMany({
      where: {
        userId: userId,
        conjurationId: image.conjurationId,
        sessionId: image.sessionId,
        characterId: image.characterId,
        primary: true,
      },
    });

    await sendWebsocketMessage(userId, WebSocketEvent.PrimaryImageSet, {
      images: updatedImages,
      context: {
        conjurationId: image.conjurationId,
      },
    });
  }

  @Security('jwt')
  @OperationId('getConjurationImageHistory')
  @Get('/conjurations/:conjurationId/history')
  public async getConjurationImageHistory(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() conjurationId: number,
  ): Promise<Image[]> {
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

    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
      include: {
        images: {
          where: {
            NOT: {
              uri: null,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            imageModel: true,
          },
        },
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    return conjuration.images;
  }
}
