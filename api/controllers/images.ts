import { Body, Inject, OperationId, Post, Route, Security, Tags } from 'tsoa';
import { TrackingInfo } from '../lib/tracking';
import { generateImage } from '../services/imageGeneration';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';

interface PostImageRequest {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: ImageStylePreset;
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
    @Body() request: PostImageRequest,
  ): Promise<void> {
    const count = 3;

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
}
