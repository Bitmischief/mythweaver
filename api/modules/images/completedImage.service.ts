import { Image, ImageModel } from '@prisma/client';
import { ImagesDataProvider } from './images.dataprovider';
import { MythWeaverLogger } from '../../lib/logger';
import {
  ApiImageGenerationResponse,
  ImageGenerationRequest,
} from './images.interface';
import {
  WebSocketEvent,
  sendWebsocketMessage,
} from '../../services/websockets';
import { ImageCreditChangeType } from '@prisma/client';
import { StorageProvider } from '../../providers/storageProvider';
import { CreditsProvider } from '@/providers/creditsProvider';

export class CompletedImageService {
  constructor(
    private readonly logger: MythWeaverLogger,
    private readonly imagesDataProvider: ImagesDataProvider,
    private readonly storageProvider: StorageProvider,
    private readonly creditsProvider: CreditsProvider,
  ) {}

  async processGeneratedImages(
    apiImages: ApiImageGenerationResponse[],
    images: Image[],
    request: ImageGenerationRequest,
    model: ImageModel,
  ): Promise<void> {
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const apiImageResponse = apiImages[i];

      if (apiImageResponse.nsfw) {
        await this.imagesDataProvider.updateImage(image.id, {
          generating: false,
          failed: true,
        });
        continue;
      }

      this.logger.info(`Image generated successfully`, { imageId: image.id });
      const url = await this.storageProvider.saveImage(
        image.id.toString(),
        apiImageResponse.base64,
      );
      this.logger.info(`Image saved successfully`, { imageId: image.id, url });

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

      const imageCredits = await this.creditsProvider.modifyImageCreditCount(
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
}
