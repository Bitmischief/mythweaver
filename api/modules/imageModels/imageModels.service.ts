import { AppEvent, track, TrackingInfo } from '@/lib/tracking';
import { ImageModelsDataProvider } from '@/modules/imageModels/imageModels.dataprovider';
import { GetImageModelsResponse } from '@/modules/imageModels/imageModels.interface';

export class ImageModelsService {
  constructor(private imageModelsDataProvider: ImageModelsDataProvider) {}

  async getImageModels(
    userId: number,
    trackingInfo: TrackingInfo,
    offset: number,
    limit: number,
  ): Promise<GetImageModelsResponse> {
    const models = await this.imageModelsDataProvider.getImageModels(
      offset,
      limit,
    );

    track(AppEvent.GetImageModels, userId, trackingInfo);

    return {
      data: models,
      offset,
      limit,
    };
  }
}
