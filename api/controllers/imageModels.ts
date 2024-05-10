import { Get, Inject, OperationId, Query, Route, Security, Tags } from 'tsoa';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { MythWeaverLogger } from '../lib/logger';
import { GetGeneratorsResponse } from './generators';
import { prisma } from '../lib/providers/prisma';

@Route('models/images')
@Tags('Image Models')
export class ImageModelController {
  @Get('/')
  @Security('jwt')
  @OperationId('getImageModels')
  public async getImageModels(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() offset = 0,
    @Query() limit = 50,
  ): Promise<GetGeneratorsResponse> {
    const models = await prisma.imageModel.findMany({
      include: {
        artists: {
          select: {
            artist: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    track(AppEvent.GetImageModels, userId, trackingInfo);

    return {
      data: models,
      offset,
      limit,
    };
  }
}
