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
  ImageEditRequest,
  ImageOutpaintRequest,
} from './images.interface';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { Image } from '@prisma/client';
import { Express } from 'express';

@Route('images')
@Tags('Images')
export class ImagesController {
  constructor(
    private imagesService: ImagesService,
    private logger: MythWeaverLogger,
  ) {}

  @Security('jwt')
  @OperationId('uploadImage')
  @Post('/upload')
  public async uploadImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() file: any,
  ): Promise<Image> {
    return this.imagesService.uploadImage(userId, file?.originalname ?? '', file?.location ?? '');
  }

  @Security('jwt')
  @OperationId('generateImage')
  @Post('/')
  public async postImage(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostImageRequest,
    @Inject() referenceImage?: Express.Multer.File,
  ): Promise<void> {
    await this.imagesService.generateImage(userId, {
      ...request,
      referenceImage,
    });
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

  @Security('jwt')
  @OperationId('inpaintImage')
  @Post('/:imageId/inpaint')
  public async postImageInpaint(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
    @Body() request: ImageEditRequest & { maskFile: Express.Multer.File },
  ): Promise<Image> {
    return await this.imagesService.inpaintImage(userId, imageId, request);
  }

  @Security('jwt')
  @OperationId('outpaintImage')
  @Post('/:imageId/outpaint')
  public async postImageOutpaint(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
    @Body() request: ImageOutpaintRequest,
  ): Promise<Image> {
    return await this.imagesService.outpaintImage(userId, imageId, request);
  }

  @Security('jwt')
  @OperationId('removeBackground')
  @Post('/:imageId/remove-background')
  public async postRemoveBackground(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
  ): Promise<void> {
    await this.imagesService.removeBackground(userId, imageId);
  }

  @Security('jwt')
  @OperationId('eraseImagePortion')
  @Post('/:imageId/erase')
  public async eraseImagePortion(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
    @Body() maskFile: Express.Multer.File,
  ): Promise<Image> {
    return await this.imagesService.eraseImagePortion(
      userId,
      imageId,
      maskFile,
    );
  }

  @Security('jwt')
  @OperationId('getImageById')
  @Get('/:imageId')
  public async getImageById(
    @Inject() userId: number | undefined,
    @Inject() trackingInfo: TrackingInfo,
    @Route() imageId: number,
  ): Promise<Image> {
    return this.imagesService.getImageById(userId, imageId);
  }
}
