import {
  Get,
  Inject,
  OperationId,
  Post,
  Query,
  Path,
  Security,
  Tags,
  Route,
} from 'tsoa';
import { TrackingInfo } from '@/lib/tracking';
import { GetCampaignMembersResponse } from './members.interface';
import { MembersService } from '@/modules/campaigns/members/members.service';

@Route('/campaigns/:campaignId/members')
@Tags('Campaign Members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Security('jwt')
  @OperationId('getCampaignMembers')
  @Get('/')
  public async getCampaignMembers(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId = 0,
    @Query() offset = 0,
    @Query() limit = 25,
  ): Promise<GetCampaignMembersResponse> {
    return await this.membersService.getMembers(
      userId,
      trackingInfo,
      campaignId,
      offset,
      limit,
    );
  }

  @Security('jwt')
  @OperationId('deleteCampaignMember')
  @Post('/:memberId')
  public async deleteCampaignMember(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() campaignId = 0,
    @Path() memberId = 0,
  ): Promise<any> {
    return await this.membersService.deleteMember(
      userId,
      trackingInfo,
      campaignId,
      memberId,
    );
  }
}
