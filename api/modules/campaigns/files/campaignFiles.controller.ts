import {
  Route,
  Tags,
  Security,
  OperationId,
  Get,
  Post,
  Delete,
  Inject,
  Body,
} from 'tsoa';
import { CampaignFilesService } from './campaignFiles.service';
import { PostCampaignFileRequest } from './campaignFiles.interface';
import { CampaignRole } from '../campaigns.interface';
import { ContextType } from '@prisma/client';
import { TrackingInfo } from '../../../lib/tracking';

@Route('campaigns/:campaignId/files')
@Tags('Campaign Files')
export class CampaignFilesController {
  constructor(private campaignFilesService: CampaignFilesService) {}

  @Security('jwt')
  @OperationId('postCampaignFile')
  @Post('/')
  public async postCampaignFiles(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId: number,
    @Body() request: PostCampaignFileRequest,
  ) {
    return await this.campaignFilesService.createCampaignFile(
      userId,
      trackingInfo,
      campaignId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('getCampaignFiles')
  @Get('/')
  public async getCampaignFiles(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId: number,
  ) {
    return await this.campaignFilesService.getCampaignFiles(
      userId,
      trackingInfo,
      campaignId,
    );
  }

  @Security('jwt')
  @OperationId('deleteCampaignFile')
  @Delete('/:fileId')
  public async deleteCampaignFile(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId: number,
    @Route() fileId: number,
  ) {
    return await this.campaignFilesService.deleteCampaignFile(
      userId,
      trackingInfo,
      campaignId,
      fileId,
    );
  }
}
