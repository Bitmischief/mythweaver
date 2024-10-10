import { ImagesDataProvider } from './images.dataprovider';
import { StabilityAIProvider } from '../../providers/stabilityAI';
import { MythWeaverLogger } from '../../lib/logger';
import {
  PostImageRequest,
  ImageGenerationRequest,
  GeneratedImage,
  ImageEditRequest,
  ImageOutpaintRequest,
  ImageEdit,
} from './images.interface';
import { AppError, ErrorType, HttpCode } from '../../lib/errors/AppError';
import { Image, ImageCreditChangeType } from '@prisma/client';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import { modifyImageCreditCount } from '../../services/credits';
import { AppEvent, track } from '../../lib/tracking';
import { checkImageStatusQueue } from '../../worker';
import retry from 'async-await-retry';
import { AxiosError } from 'axios';
import axios from 'axios';
import { date } from 'zod';

export class ImagesService {
  constructor(
    private imagesDataProvider: ImagesDataProvider,
    private stabilityAIProvider: StabilityAIProvider,
    private logger: MythWeaverLogger,
  ) {}

  async generateImage(
    userId: number,
    request: PostImageRequest,
  ): Promise<void> {
    const user = await this.imagesDataProvider.findUser(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const count = request.count || 3;

    if (user.imageCredits < count) {
      throw new AppError({
        description:
          'You do not have enough image credits to generate this many images.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (!request.modelId) {
      const defaultModel =
        await this.imagesDataProvider.findDefaultImageModel();
      if (!defaultModel) {
        throw new AppError({
          description: 'Default model not found.',
          httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
      }
      request.modelId = defaultModel.id;
    }

    const imagePromises = [];
    for (let i = 0; i < count; i++) {
      const imagePromise = this.generateSingleImage({
        ...request,
        userId,
        count,
      });
      imagePromises.push(imagePromise);
    }

    await Promise.all(imagePromises);
  }

  async setConjurationId(
    userId: number,
    imageId: number,
    conjurationId: number,
  ): Promise<void> {
    const user = await this.imagesDataProvider.findUser(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);

    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
    }

    await this.imagesDataProvider.updateImage(imageId, {
      conjurationId: conjurationId,
    });
  }

  async upscaleImage(userId: number, imageId: number): Promise<void> {
    const user = await this.imagesDataProvider.findUser(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);

    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
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

    try {
      const upscaledImageUri = await this.stabilityAIProvider.upscaleImage({
        userId,
        imageId,
        imageUri: image.uri,
      });

      await this.imagesDataProvider.updateImage(imageId, {
        uri: upscaledImageUri,
      });

      const imageCredits = await modifyImageCreditCount(
        userId,
        -1,
        ImageCreditChangeType.USER_INITIATED,
        `Image upscale: ${upscaledImageUri}`,
      );

      await sendWebsocketMessage(
        userId,
        WebSocketEvent.UserImageCreditCountUpdated,
        imageCredits,
      );

      await sendWebsocketMessage(userId, WebSocketEvent.ImageUpscaled, {
        imageId: imageId,
        imageUri: upscaledImageUri,
      });
    } catch (error) {
      throw new AppError({
        description: 'Failed to upscale image.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: userId,
          errorCode: ErrorType.ImageUpscaleError,
          context: {
            imageId: imageId,
            userId: userId,
          },
        },
      });
    }
  }

  async setPrimaryImage(userId: number, imageId: number): Promise<void> {
    const user = await this.imagesDataProvider.findUser(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);

    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
    }

    await this.imagesDataProvider.updateManyImages(
      {
        userId: userId,
        conjurationId: image.conjurationId,
        sessionId: image.sessionId,
        characterId: image.characterId,
      },
      {
        primary: false,
      },
    );

    const updatedImage = await this.imagesDataProvider.updateImage(imageId, {
      primary: true,
    });

    await sendWebsocketMessage(userId, WebSocketEvent.PrimaryImageSet, {
      images: [updatedImage],
      context: {
        conjurationId: image.conjurationId,
      },
    });
  }

  async getConjurationImageHistory(
    userId: number,
    conjurationId: number,
  ): Promise<Image[]> {
    const user = await this.imagesDataProvider.findUser(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const conjuration = await this.imagesDataProvider.findConjuration(
      conjurationId,
      userId,
    );

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    return this.imagesDataProvider.getConjurationImages(conjurationId);
  }

  async getUserImages(
    userId: number,
    offset = 0,
    limit = 50,
  ): Promise<{ images: Image[]; total: number }> {
    const [images, total] = await Promise.all([
      this.imagesDataProvider.getUserImages(userId, offset, limit),
      this.imagesDataProvider.countUserImages(userId),
    ]);

    return { images, total };
  }

  private async generateSingleImage(
    request: ImageGenerationRequest,
  ): Promise<Image | undefined> {
    const image = await this.imagesDataProvider.createImage({
      userId: request.userId,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      stylePreset: request.stylePreset,
      ...request.linking,
      primary: request.forceImagePrimary || false,
      generating: true,
      failed: false,
      modelId: request.modelId,
    });

    await checkImageStatusQueue.add(
      {
        userId: request.userId,
        imageId: image.id,
      },
      {
        delay: 120000,
      },
    );

    const imageGenerationResponse = await this.generateImageFromProperProvider({
      ...request,
      imageId: image.id,
    });

    if (!imageGenerationResponse) {
      await this.imagesDataProvider.updateImage(image.id, {
        generating: false,
        failed: true,
      });
      return;
    }

    const updatedImage = await this.updateImage(image.id, 'original', imageGenerationResponse.uri);

    await sendWebsocketMessage(request.userId, WebSocketEvent.ImageCreated, {
      image: updatedImage,
      modelId: image.modelId,
      imageId: image.id,
      context: {
        ...request.linking,
      },
    });

    return updatedImage;
  }

  private async generateImageFromProperProvider(
    request: ImageGenerationRequest,
  ): Promise<GeneratedImage | undefined> {
    const model = await this.imagesDataProvider.findImageModel(
      request.modelId!,
    );

    if (!model) {
      throw new AppError({
        description: 'Image model not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    let imageGenerationResponse: GeneratedImage;

    try {
      if (model.stableDiffusionApiModel) {
        imageGenerationResponse = await retry(async () => {
          return await this.stabilityAIProvider.generateImage(request);
        });
      } else {
        // Implement MythWeaver model image generation here
        throw new Error('MythWeaver model image generation not implemented');
      }
    } catch (err) {
      const e = err as AxiosError;

      this.logger.error('Received an error generating an image', request, err);

      if (e?.response?.status === 400) {
        await sendWebsocketMessage(
          request.userId,
          WebSocketEvent.ImageFiltered,
          {
            description: 'The returned images did not pass our content filter.',
            context: {
              ...request.linking,
            },
          },
        );
      } else {
        await sendWebsocketMessage(request.userId, WebSocketEvent.Error, {
          description:
            'The image generation service was unable to generate an image.',
          context: {
            ...request.linking,
          },
        });
      }

      return;
    }

    if (!imageGenerationResponse) {
      this.logger.warn('Image generation response was undefined.');
      return;
    }

    if (request.imageId) {
      const image = await this.imagesDataProvider.findImage(
        request.imageId,
      );
      if (image?.failed) {
        return;
      }
    }

    track(AppEvent.ConjureImage, request.userId, undefined, {
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      stylePreset: request.stylePreset,
      count: request.count,
      modelId: request.modelId,
      artistId: model.artists.length ? model.artists[0].artistId : undefined,
    });

    await sendWebsocketMessage(
      request.userId,
      WebSocketEvent.ImageGenerationDone,
      {
        image: imageGenerationResponse,
      },
    );

    const imageCredits = await modifyImageCreditCount(
      request.userId,
      -1,
      ImageCreditChangeType.USER_INITIATED,
      `Image generation: ${imageGenerationResponse.uri}, ${JSON.stringify(request.linking)}`,
    );

    await sendWebsocketMessage(
      request.userId,
      WebSocketEvent.UserImageCreditCountUpdated,
      imageCredits,
    );

    if (model.paysRoyalties) {
      const { amountSupportingArtistsUsd } =
        await this.imagesDataProvider.updateUserArtistContributions(
          request.userId,
        );

      await sendWebsocketMessage(
        request.userId,
        WebSocketEvent.UserArtistContributionsUpdated,
        amountSupportingArtistsUsd,
      );
    }

    return imageGenerationResponse;
  }

  async inpaintImage(userId: number, imageId: number, request: ImageEditRequest & { maskFile: Express.Multer.File }): Promise<Image> {
    const user = await this.imagesDataProvider.findUser(userId);
    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);
    if (!image || !image.uri) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
    }

    if (user.imageCredits < 3) {
      throw new AppError({
        description: 'Not enough image credits for inpainting.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      const imageBuffer = await this.getImageBuffer(image.uri);
      const maskBuffer = request.maskFile.buffer;
      
      const inpaintedImageUri = await this.stabilityAIProvider.inpaintImage(
        imageBuffer,
        maskBuffer,
        request.prompt,
        request.negativePrompt,
        request.seed
      );

      const updatedImage = await this.updateImage(imageId, 'inpainting', inpaintedImageUri);

      await this.deductCreditsAndNotify(userId, 3, 'Image inpainting');

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { inpainted: true },
      });

      return updatedImage;
    } catch (error) {
      throw new AppError({
        description: 'Failed to inpaint image.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: userId,
          errorCode: ErrorType.ImageInpaintError,
          context: { imageId: imageId, userId: userId },
        },
      });
    }
  }

  async outpaintImage(userId: number, imageId: number, request: ImageOutpaintRequest): Promise<Image> {
    const user = await this.imagesDataProvider.findUser(userId);
    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);
    if (!image || !image.uri) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
    }

    if (user.imageCredits < 4) {
      throw new AppError({
        description: 'Not enough image credits for outpainting.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      const imageBuffer = await this.getImageBuffer(image.uri);
      
      const outpaintedImageUri = await this.stabilityAIProvider.outpaintImage(
        imageBuffer,
        request.left,
        request.right,
        request.up,
        request.down,
        request.prompt,
        request.creativity,
        request.seed
      );

      const updatedImage = await this.updateImage(imageId, 'outpainting', outpaintedImageUri);

      await this.deductCreditsAndNotify(userId, 4, 'Image outpainting');

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { outpainted: true },
      });

      return updatedImage;
    } catch (error) {
      throw new AppError({
        description: 'Failed to outpaint image.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: userId,
          errorCode: ErrorType.ImageOutpaintError,
          context: { imageId: imageId, userId: userId },
        },
      });
    }
  }

  async removeBackground(userId: number, imageId: number): Promise<void> {
    const user = await this.imagesDataProvider.findUser(userId);
    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);
    if (!image || !image.uri) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
    }

    if (user.imageCredits < 2) {
      throw new AppError({
        description: 'Not enough image credits for background removal.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      const imageBuffer = await this.getImageBuffer(image.uri);
      
      const backgroundRemovedImageUri = await this.stabilityAIProvider.removeBackground(imageBuffer);

      const updatedImage = await this.updateImage(imageId, 'background_removal', backgroundRemovedImageUri);

      await this.deductCreditsAndNotify(userId, 2, 'Background removal');

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { backgroundRemoved: true },
      });
    } catch (error) {
      throw new AppError({
        description: 'Failed to remove background from image.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: userId,
          errorCode: ErrorType.ImageBackgroundRemovalError,
          context: { imageId: imageId, userId: userId },
        },
      });
    }
  }

  private async getImageBuffer(uri: string): Promise<Buffer> {
    const response = await axios.get(uri, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  }

  private async deductCreditsAndNotify(userId: number, credits: number, reason: string): Promise<void> {
    const imageCredits = await modifyImageCreditCount(
      userId,
      -credits,
      ImageCreditChangeType.USER_INITIATED,
      reason
    );

    await sendWebsocketMessage(
      userId,
      WebSocketEvent.UserImageCreditCountUpdated,
      imageCredits
    );
  }

  async eraseImagePortion(userId: number, imageId: number, maskFile: Express.Multer.File): Promise<Image> {
    const user = await this.imagesDataProvider.findUser(userId);
    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.findImage(imageId);
    if (!image || !image.uri) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (userId !== image.userId) {
      throw new AppError({
        description: "You are not the owner of this image",
        httpCode: HttpCode.UNAUTHORIZED,
      })
    }

    if (user.imageCredits < 1) {
      throw new AppError({
        description: 'Not enough image credits for erasing image portion.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      const maskBuffer = maskFile.buffer;
      const erasedImageUri = await this.stabilityAIProvider.eraseImagePortion(image.uri, maskBuffer);

      const updatedImage = await this.updateImage(imageId, 'smart_erase', erasedImageUri);

      await this.deductCreditsAndNotify(userId, 1, 'Image portion erasing');

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { erased: true },
      });

      return updatedImage;
    } catch (error) {
      throw new AppError({
        description: 'Failed to erase image portion.',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        websocket: {
          userId: userId,
          errorCode: ErrorType.ImageEraseError,
          context: { imageId: imageId, userId: userId },
        },
      });
    }
  }

  private async updateImage(imageId: number, editType: ImageEdit['type'], newUri: string): Promise<Image> {
    const image = await this.imagesDataProvider.findImage(imageId);
    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const edits = image.edits as unknown as ImageEdit[] || [];

    if (edits.length === 0) {
      edits.push({
        dateCreated: image.createdAt?.toISOString() || new Date().toISOString(),
        type: 'original',
        uri: image.uri!,
      });
    }

    edits.push({
      dateCreated: new Date().toISOString(),
      type: editType,
      uri: newUri,
    });

    return this.imagesDataProvider.updateImage(imageId, {
      uri: newUri,
      edits,
    });
  }

  async getImageById(userId: number | undefined, imageId: number): Promise<Image> {
    const image = await this.imagesDataProvider.findImage(imageId);

    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (userId) {
      if (image.userId !== userId) {
        throw new AppError({
          description: 'You do not have permission to access this image.',
          httpCode: HttpCode.FORBIDDEN,
        });
      }
    }

    return image;
  }
}