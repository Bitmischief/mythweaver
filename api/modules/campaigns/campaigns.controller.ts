import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Post,
  Put,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { Campaign } from '@prisma/client';
import { AppEvent, track, TrackingInfo } from '../../lib/tracking';
import { CampaignsService } from './campaigns.service';
import {
  GetCampaignsResponse,
  PostCampaignRequest,
  PutCampaignRequest,
  InviteMemberRequest,
} from './campaigns.interface';

@Route('campaigns')
@Tags('Campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

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
    return this.campaignsService.getCampaigns(
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
    @Route() campaignId = 0,
  ): Promise<Campaign> {
    return await this.campaignsService.getCampaign(
      userId,
      trackingInfo,
      campaignId,
    );
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
    return await this.campaignsService.createCampaign(
      userId,
      trackingInfo,
      request,
    );
  }

  @Security('jwt')
  @OperationId('putCampaign')
  @Put('/:campaignId')
  public async putCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId = 0,
    @Body() request: PutCampaignRequest,
  ): Promise<Campaign> {
    return await this.campaignsService.updateCampaign(
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
    @Route() campaignId: number,
  ): Promise<void> {
    return await this.campaignsService.deleteCampaign(
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
    @Route() campaignId = 0,
    @Body() request: InviteMemberRequest,
  ): Promise<any> {
    return await this.campaignsService.inviteCampaignMember(
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
    @Route() inviteCode: string,
  ): Promise<any> {
    return await this.campaignsService.getInvite(inviteCode);
  }

  @Security('jwt')
  @OperationId('acceptInvite')
  @Put('/invites/:inviteCode')
  public async acceptInvite(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() inviteCode: string,
  ) {
    return await this.campaignsService.acceptInvite(
      userId,
      trackingInfo,
      inviteCode,
    );
  }

  @Security('jwt')
  @OperationId('getCampaignCharacter')
  @Put('/:campaignId/character/:characterId')
  public async getCampaignCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId: number,
    @Route() characterId: number,
  ) {
    return await this.campaignsService.getCampaignCharacter(
      userId,
      trackingInfo,
      campaignId,
      characterId,
    );
  }

  @Security('jwt')
  @OperationId('getMyCampaignCharacters')
  @Put('/:campaignId/characters')
  public async getMyCampaignCharacters(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId: number,
  ) {
    return await this.campaignsService.getMyCampaignCharacters(
      userId,
      trackingInfo,
      campaignId,
    );
  }
}
