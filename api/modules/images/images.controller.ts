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
  Query,
} from 'tsoa';
import { AppEvent, track, TrackingInfo } from '../../lib/tracking';
import { MythWeaverLogger } from '../../lib/logger';
import { ImagesService } from './images.service';
import {
  PostImageRequest,
  PatchImageConjurationIdRequest,
  ImageStylePreset,
} from './images.interface';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { Image } from '@prisma/client';

@Route('images')
@Tags('Images')
export class ImagesController {
  constructor(
    private imagesService: ImagesService,
    private logger: MythWeaverLogger,
  ) {}

  @Security('jwt')
  @OperationId('generateImage')
  @Post('/')
  public async postImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostImageRequest,
  ): Promise<void> {
    await this.imagesService.generateImage(userId, request);
  }

  @Security('jwt')
  @OperationId('setConjurationId')
  @Patch('/:imageId/conjurationId')
  public async patchImageConjurationId(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
    @Body() request: PatchImageConjurationIdRequest,
  ): Promise<void> {
    await this.imagesService.setConjurationId(
      userId,
      imageId,
      request.conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('upscaleImage')
  @Post('/:imageId/upscale')
  public async postImageUpscale(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
  ): Promise<void> {
    await this.imagesService.upscaleImage(userId, imageId);
  }

  @Security('jwt')
  @OperationId('setPrimary')
  @Patch('/:imageId/primary')
  public async patchPrimaryImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
  ): Promise<void> {
    await this.imagesService.setPrimaryImage(userId, imageId);
  }

  @Security('jwt')
  @OperationId('getConjurationImageHistory')
  @Get('/conjurations/:conjurationId/history')
  public async getConjurationImageHistory(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
  ): Promise<Image[]> {
    return this.imagesService.getConjurationImageHistory(userId, conjurationId);
  }

  @Security('jwt')
  @OperationId('getUserImages')
  @Get('/gallery')
  public async getUserImages(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset = 0,
    @Query() limit = 50,
  ): Promise<{ images: Image[]; total: number }> {
    const result = await this.imagesService.getUserImages(
      userId,
      offset,
      limit,
    );
    track(AppEvent.GetUserImageGallery, userId, trackingInfo);
    return result;
  }
}
