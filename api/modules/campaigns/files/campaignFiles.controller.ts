import {
  Path,
  Tags,
  Security,
  OperationId,
  Get,
  Post,
  Delete,
  Inject,
  Body,
  Route,
} from 'tsoa';
import { CampaignFilesService } from '@/modules/campaigns/files/campaignFiles.service';
import { PostCampaignFileRequest } from '@/modules/campaigns/files/campaignFiles.interface';
import { TrackingInfo } from '@/modules/core/analytics/tracking';

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
    @Path() campaignId: number,
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
    @Path() campaignId: number,
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
    @Path() campaignId: number,
    @Path() fileId: number,
  ) {
    return await this.campaignFilesService.deleteCampaignFile(
      userId,
      trackingInfo,
      campaignId,
      fileId,
    );
  }
}
