import { ImagesDataProvider } from './images.dataprovider';
import { ImageModelsDataProvider } from '@/modules/imageModels/imageModels.dataprovider';
import { StabilityAIProvider } from '../../providers/stabilityAI';
import { MythWeaverLogger } from '../../lib/logger';
import {
  PostImageRequest,
  ImageGenerationRequest,
  GeneratedImage,
  ImageEditRequest,
  ImageOutpaintRequest,
  ImageEdit,
  ImageEditType,
  ApiImageGenerationResponse,
} from './images.interface';
import { AppError, ErrorType, HttpCode } from '../../lib/errors/AppError';
import { Image, ImageCreditChangeType, ImageModel } from '@prisma/client';
import {
  sendWebsocketMessage,
  WebSocketEvent,
} from '../../services/websockets';
import { modifyImageCreditCount } from '../../services/credits';
import { checkImageStatusQueue } from '../../worker';
import retry from 'async-await-retry';
import { AxiosError } from 'axios';
import axios from 'axios';
import { generateMythWeaverModelImage } from '../../services/images/mythweaverImageService';
import { v4 as uuidv4 } from 'uuid';
import { saveImage } from '../../services/dataStorage';

export class ImagesService {
  constructor(
    private imagesDataProvider: ImagesDataProvider,
    private stabilityAIProvider: StabilityAIProvider,
    private logger: MythWeaverLogger,
  ) {}

  async generateImage(
    userId: number,
    request: PostImageRequest,
  ): Promise<Image[]> {
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
          'You do not have enough credits to generate this many images.',
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

    let referenceImage: Buffer | undefined;
    if (request.imageId) {
      const image = await this.imagesDataProvider.findImage(request.imageId);
      if (!image || !image.uri) {
        throw new AppError({
          description: 'Reference image not found.',
          httpCode: HttpCode.BAD_REQUEST,
        });
      }
      referenceImage = await this.getImageBuffer(image.uri);
    }

    const images = [];

    for (let i = 0; i < count; i++) {
      const image = await this.imagesDataProvider.createImage({
        userId,
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        stylePreset: request.stylePreset,
        ...request.linking,
        primary: false,
        generating: true,
        failed: false,
        modelId: request.modelId,
      });

      images.push(image);
    }

    this.generateImages(images, {
      ...request,
      userId,
      count,
      referenceImage,
    });

    return images;
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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
      });
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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
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
        description: 'You do not have enough credits to upscale this image.',
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

      await sendWebsocketMessage(userId, WebSocketEvent.ImageUpscaled, {
        imageId: imageId,
        imageUri: upscaledImageUri,
      });
    } catch (error) {
      this.logger.error(
        'Failed to upscale image',
        {
          userId,
          imageId,
        },
        error,
      );

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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
      });
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

  private async generateImages(
    images: Image[],
    request: ImageGenerationRequest,
  ): Promise<void> {
    for (const image of images) {
      await checkImageStatusQueue.add(
        {
          userId: request.userId,
          imageId: image.id,
        },
        {
          delay: 120000,
        },
      );
    }

    await this.generateImagesFromProperProvider(request, images);
  }

  private async generateImagesFromProperProvider(
    request: ImageGenerationRequest,
    images: Image[],
  ): Promise<GeneratedImage[] | undefined> {
    const model = await this.imagesDataProvider.findImageModel(
      request.modelId!,
    );

    if (!model) {
      throw new AppError({
        description: 'Image model not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      await this.processGeneratedImage(model, request, images);
    } catch (err) {
      const e = err as AxiosError;

      this.logger.error(
        'Received an error generating an image',
        {
          request,
          responseBody: e?.response?.data,
        },
        e,
      );

      await sendWebsocketMessage(request.userId, WebSocketEvent.Error, {
        description:
          'The image generation service was unable to generate an image.',
        context: {
          ...request.linking,
        },
      });

      return;
    }
  }

  async processGeneratedImage(
    model: ImageModel,
    request: ImageGenerationRequest,
    images: Image[],
  ): Promise<void> {
    let apiImages: ApiImageGenerationResponse[] = [];

    if (model.stableDiffusionApiModel) {
      apiImages = await retry(async () => {
        return await this.stabilityAIProvider.generateImage(request);
      });
    } else {
      apiImages = await generateMythWeaverModelImage(request, model, images);
    }

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const apiImageResponse = apiImages[i];

      this.logger.info(`Image generated successfully`, { imageId: image.id });
      const url = await saveImage(image.id.toString(), apiImageResponse.base64);
      this.logger.info(`Image saved successfully`, { imageId: image.id, url });

      await this.updateImage(image.id, ImageEditType.ORIGINAL, url);

      const updatedImage = await this.imagesDataProvider.updateImage(image.id, {
        uri: url,
        generating: false,
        failed: false,
      });

      await sendWebsocketMessage(request.userId, WebSocketEvent.ImageCreated, {
        image: updatedImage,
        modelId: image.modelId,
        modelName: model?.description,
        imageId: image.id,
        context: {
          ...request.linking,
        },
      });

      const imageCredits = await modifyImageCreditCount(
        request.userId,
        -1,
        ImageCreditChangeType.USER_INITIATED,
        `Image generation: ${updatedImage.uri}, ${JSON.stringify(request.linking)}`,
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
    }
  }

  async inpaintImage(
    userId: number,
    imageId: number,
    request: ImageEditRequest & { maskFile: Express.Multer.File },
  ): Promise<Image> {
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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
      });
    }

    if (user.imageCredits < 3) {
      throw new AppError({
        description: 'Not enough credits for inpainting.',
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
        request.seed,
      );

      const updatedImage = await this.updateImage(
        imageId,
        ImageEditType.INPAINTING,
        inpaintedImageUri,
      );

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { inpainted: true },
        image: updatedImage,
      });

      return updatedImage;
    } catch (error) {
      this.logger.error(
        'Failed to inpaint image',
        {
          userId,
          imageId,
          prompt: request.prompt,
          negativePrompt: request.negativePrompt,
        },
        error,
      );

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

  async outpaintImage(
    userId: number,
    imageId: number,
    request: ImageOutpaintRequest,
  ): Promise<Image> {
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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
      });
    }

    if (user.imageCredits < 4) {
      throw new AppError({
        description: 'Not enough credits for outpainting.',
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
        request.seed,
      );

      const updatedImage = await this.updateImage(
        imageId,
        ImageEditType.OUTPAINTING,
        outpaintedImageUri,
      );

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { outpainted: true },
      });

      return updatedImage;
    } catch (error) {
      this.logger.error(
        'Failed to outpaint image',
        {
          userId,
          imageId,
          request: {
            prompt: request.prompt,
            left: request.left,
            right: request.right,
            up: request.up,
            down: request.down,
          },
        },
        error,
      );

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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
      });
    }

    if (user.imageCredits < 2) {
      throw new AppError({
        description: 'Not enough credits for background removal.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      const imageBuffer = await this.getImageBuffer(image.uri);

      const backgroundRemovedImageUri =
        await this.stabilityAIProvider.removeBackground(imageBuffer);

      await this.updateImage(
        imageId,
        ImageEditType.BACKGROUND_REMOVAL,
        backgroundRemovedImageUri,
      );

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { backgroundRemoved: true },
      });
    } catch (error) {
      this.logger.error(
        'Failed to remove background',
        {
          userId,
          imageId,
        },
        error,
      );

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

  private async deductCreditsAndNotify(
    userId: number,
    credits: number,
    reason: string,
  ): Promise<void> {
    const imageCredits = await modifyImageCreditCount(
      userId,
      -credits,
      ImageCreditChangeType.USER_INITIATED,
      reason,
    );

    await sendWebsocketMessage(
      userId,
      WebSocketEvent.UserImageCreditCountUpdated,
      imageCredits,
    );
  }

  async eraseImagePortion(
    userId: number,
    imageId: number,
    maskFile: Express.Multer.File,
  ): Promise<Image> {
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
        description: 'You are not the owner of this image',
        httpCode: HttpCode.UNAUTHORIZED,
      });
    }

    if (user.imageCredits < 1) {
      throw new AppError({
        description: 'Not enough credits for erasing image portion.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    try {
      const maskBuffer = maskFile.buffer;
      const erasedImageUri = await this.stabilityAIProvider.eraseImagePortion(
        image.uri,
        maskBuffer,
      );

      const updatedImage = await this.updateImage(
        imageId,
        ImageEditType.SMART_ERASE,
        erasedImageUri,
      );

      await sendWebsocketMessage(userId, WebSocketEvent.ImageEdited, {
        imageId,
        context: { erased: true },
      });

      return updatedImage;
    } catch (error) {
      this.logger.error('Failed to erase image portion', { imageId }, error);
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

  private async updateImage(
    imageId: number,
    editType: ImageEdit['type'],
    newUri: string,
  ): Promise<Image> {
    const image = await this.imagesDataProvider.findImage(imageId);
    if (!image) {
      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const edits = (image.edits as unknown as ImageEdit[]) || [];

    if (edits.length === 0 && editType !== ImageEditType.ORIGINAL) {
      edits.push({
        id: uuidv4(),
        dateCreated: image.createdAt?.toISOString() || new Date().toISOString(),
        type: ImageEditType.ORIGINAL,
        uri: image.uri || newUri,
      });
    }

    if (editType !== ImageEditType.ORIGINAL || edits.length === 0) {
      edits.push({
        id: uuidv4(),
        dateCreated: new Date().toISOString(),
        type: editType,
        uri: newUri,
      });
    }

    return this.imagesDataProvider.updateImage(imageId, {
      uri: newUri,
      edits,
    });
  }

  async getImageById(
    userId: number | undefined,
    imageId: number,
  ): Promise<Image> {
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

  async uploadImage(
    userId: number,
    filename: string,
    fileUri: string,
  ): Promise<Image> {
    const user = await this.imagesDataProvider.findUser(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const image = await this.imagesDataProvider.createImage({
      userId,
      uri: fileUri,
      prompt: '',
      primary: false,
      generating: false,
      failed: false,
      uploaded: true,
    });

    return image;
  }

  async setImageToEdit(
    userId: number,
    imageId: number,
    editId: string,
  ): Promise<Image> {
    const image = await this.imagesDataProvider.findImage(imageId);

    if (!image) {
      this.logger.error('Image not found for setImageToEdit', {
        userId,
        imageId,
        editId,
      });

      throw new AppError({
        description: 'Image not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (image.userId !== userId) {
      this.logger.error('Unauthorized access attempt to modify image', {
        userId,
        imageId,
        imageOwnerId: image.userId,
      });

      throw new AppError({
        description: 'You do not have permission to modify this image.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const edits = image.edits as unknown as ImageEdit[];

    if (!edits) {
      throw new AppError({
        description: 'No edits found for this image.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const selectedEdit = edits.find((edit) => edit.id === editId);

    if (!selectedEdit) {
      throw new AppError({
        description: 'Edit not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const updatedImage = await this.imagesDataProvider.updateImage(imageId, {
      uri: selectedEdit.uri,
    });

    await sendWebsocketMessage(userId, WebSocketEvent.ImageUrlUpdated, {
      imageId: imageId,
      newUrl: selectedEdit.uri,
    });

    return updatedImage;
  }

  async deleteImageEdits(userId: number, imageId: number): Promise<Image> {
    return this.imagesDataProvider.updateImage(imageId, { edits: [] });
  }
}
