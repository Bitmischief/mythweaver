import {
  Get,
  Inject,
  OperationId,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { TrackingInfo } from '../../../lib/tracking';
import { GetCampaignMembersResponse } from './members.interface';
import { MembersService } from './members.service';

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
    @Route() campaignId = 0,
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
    @Route() campaignId = 0,
    @Route() memberId = 0,
  ): Promise<any> {
    return await this.membersService.deleteMember(
      userId,
      trackingInfo,
      campaignId,
      memberId,
    );
  }
}
