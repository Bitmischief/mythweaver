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
  Delete,
} from 'tsoa';
import { TrackingInfo } from '../../lib/tracking';
import { MythWeaverLogger } from '../../lib/logger';
import { Conjuration, ConjurationRelationshipType } from '@prisma/client';
import {
  PatchConjurationRequest,
  GetConjurationsResponse,
  GetConjurationTagsResponse,
  ConvertConjurationRequest,
} from './conjurations.interface';
import { ImageStylePreset } from '../images/images.interface';
import { ConjurationsService } from './conjurations.service';

@Route('conjurations')
@Tags('Conjurations')
export class ConjurationsController {
  constructor(
    private conjurationsService: ConjurationsService,
    private logger: MythWeaverLogger,
  ) {}

  @Security('jwt')
  @OperationId('getConjurations')
  @Get('/')
  public async getConjurations(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() campaignId?: number,
    @Query() saved?: boolean,
    @Query() conjurerCodeString?: string,
    @Query() stylePreset?: ImageStylePreset,
    @Query() tags?: string,
    @Query() offset?: number,
    @Query() limit?: number,
    @Query() history?: boolean,
    @Query() search?: string,
    @Query() nodeId?: number,
    @Query() nodeType?: ConjurationRelationshipType,
    @Query() collectionId?: number,
  ): Promise<GetConjurationsResponse> {
    return await this.conjurationsService.getConjurations(
      userId,
      trackingInfo,
      campaignId,
      saved,
      conjurerCodeString,
      stylePreset,
      tags,
      offset,
      limit,
      history,
      search,
      nodeId,
      nodeType,
      collectionId,
    );
  }

  @Security('jwt')
  @OperationId('getConjuration')
  @Get('/:conjurationId')
  public async getConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
  ): Promise<Conjuration & { saved: boolean; campaignIds: number[] }> {
    return await this.conjurationsService.getConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('saveConjuration')
  @Post('/:conjurationId/save')
  public async postSaveConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
  ): Promise<void> {
    await this.conjurationsService.saveConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('updateConjuration')
  @Patch('/:conjurationId')
  public async patchConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
    @Body() request: PatchConjurationRequest,
  ): Promise<Conjuration> {
    return await this.conjurationsService.updateConjuration(
      userId,
      trackingInfo,
      conjurationId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('deleteConjuration')
  @Delete('/:conjurationId')
  public async deleteConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
  ): Promise<boolean> {
    return await this.conjurationsService.deleteConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('getConjurationTags')
  @Get('/tags')
  public async getConjurationTags(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number,
  ): Promise<GetConjurationTagsResponse> {
    return await this.conjurationsService.getConjurationTags(
      userId,
      trackingInfo,
      term,
      offset,
      limit,
    );
  }

  @Security('jwt')
  @OperationId('removeConjuration')
  @Post('/:conjurationId/remove')
  public async postRemoveConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
  ): Promise<void> {
    await this.conjurationsService.removeConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('copyConjuration')
  @Post('/:conjurationId/copy')
  public async postCopyConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() conjurationId: number,
  ): Promise<Conjuration | null> {
    return await this.conjurationsService.copyConjuration(
      userId,
      trackingInfo,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('getConjurationRequest')
  @Get('/request/:requestId')
  public async getConjurationRequest(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() requestId: number,
  ): Promise<Conjuration> {
    return await this.conjurationsService.getConjurationRequest(
      userId,
      trackingInfo,
      requestId,
    );
  }

  @Security('jwt')
  @OperationId('postConvertConjurationRequest')
  @Post('/convert')
  public async convertConjurationTypes(
    @Inject() userId: number,
    @Body() request: ConvertConjurationRequest,
  ): Promise<Conjuration> {
    return await this.conjurationsService.convertConjurationTypes(
      userId,
      request,
    );
  }
}
