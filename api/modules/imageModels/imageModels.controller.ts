import { Get, Inject, OperationId, Query, Security, Tags, Route } from 'tsoa';
import { TrackingInfo } from '@/modules/core/analytics/tracking';
import { ImageModelsService } from '@/modules/imageModels/imageModels.service';
import { GetImageModelsResponse } from '@/modules/imageModels/imageModels.interface';

@Route('models/images')
@Tags('Image Models')
export class ImageModelsController {
  constructor(private imageModelsService: ImageModelsService) {}

  @Get('/')
  @Security('jwt')
  @OperationId('getImageModels')
  public async getImageModels(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset = 0,
    @Query() limit = 50,
  ): Promise<GetImageModelsResponse> {
    return this.imageModelsService.getImageModels(
      userId,
      trackingInfo,
      offset,
      limit,
    );
  }
}
