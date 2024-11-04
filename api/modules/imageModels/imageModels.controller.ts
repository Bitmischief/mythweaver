import { Get, Inject, OperationId, Query, Route, Security, Tags } from 'tsoa';
import { TrackingInfo } from '../../lib/tracking';
import { ImageModelsService } from './imageModels.service';
import { GetImageModelsResponse } from './imageModels.interface';

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
