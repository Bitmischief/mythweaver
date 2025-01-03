import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Post,
  Put,
  Query,
  Path,
  Security,
  Tags,
  Route,
  Patch,
} from 'tsoa';
import { Campaign, Prisma } from '@prisma/client';
import {
  AppEvent,
  track,
  TrackingInfo,
} from '@/modules/core/analytics/tracking';
import { CampaignService } from '@/modules/campaigns/campaign.service';
import {
  GetCampaignsResponse,
  PostCampaignRequest,
  InviteMemberRequest,
} from '@/modules/campaigns/campaign.interface';

@Route('campaigns')
@Tags('Campaigns')
export class CampaignController {
  constructor(private campaignService: CampaignService) {}

  @Security('jwt')
  @OperationId('getCampaigns')
  @Get('/')
  public async getCampaigns(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset = 0,
    @Query() limit = 25,
    @Query() term?: string,
  ): Promise<GetCampaignsResponse> {
    return this.campaignService.getCampaigns(
      userId,
      trackingInfo,
      offset,
      limit,
      term,
    );
  }

  @Security('jwt')
  @OperationId('getCampaign')
  @Get('/:campaignId')
  public async getCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId = 0,
  ): Promise<Campaign> {
    track(AppEvent.GetCampaign, userId, trackingInfo);

    return await this.campaignService.getCampaign(userId, campaignId);
  }

  @Security('jwt')
  @OperationId('createCampaign')
  @Post('/')
  public async createCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostCampaignRequest,
  ): Promise<Campaign> {
    track(AppEvent.CreateCampaign, userId, trackingInfo);
    return await this.campaignService.createCampaign(userId, request);
  }

  @Security('jwt')
  @OperationId('putCampaign')
  @Patch('/:campaignId')
  public async patchCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId = 0,
    @Body() request: Prisma.CampaignUpdateInput,
  ): Promise<Campaign> {
    return await this.campaignService.updateCampaign(
      userId,
      trackingInfo,
      campaignId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('deleteCampaign')
  @Delete('/:campaignId')
  public async deleteCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId: number,
  ): Promise<void> {
    return await this.campaignService.deleteCampaign(
      userId,
      trackingInfo,
      campaignId,
    );
  }

  @Security('jwt')
  @OperationId('inviteCampaignMember')
  @Post('/:campaignId/invite')
  public async inviteCampaignMember(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId = 0,
    @Body() request: InviteMemberRequest,
  ): Promise<any> {
    return await this.campaignService.inviteCampaignMember(
      userId,
      trackingInfo,
      campaignId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('getInvite')
  @Get('/invites/:inviteCode')
  public async getInvite(
    @Inject() trackingInfo: TrackingInfo,
    @Path() inviteCode: string,
  ): Promise<any> {
    return await this.campaignService.getInvite(inviteCode);
  }

  @Security('jwt')
  @OperationId('acceptInvite')
  @Put('/invites/:inviteCode')
  public async acceptInvite(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() inviteCode: string,
  ) {
    return await this.campaignService.acceptInvite(
      userId,
      trackingInfo,
      inviteCode,
    );
  }

  @Security('jwt')
  @OperationId('getMyCampaignCharacters')
  @Put('/:campaignId/characters')
  public async getMyCampaignCharacters(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId: number,
  ) {
    return await this.campaignService.getMyCampaignCharacters(
      userId,
      trackingInfo,
      campaignId,
    );
  }
}
