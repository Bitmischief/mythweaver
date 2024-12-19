import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { TrackingInfo, AppEvent, track } from '@/lib/tracking';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { GetCampaignMembersResponse } from '@/modules/campaigns/members/members.interface';
import { CampaignRole } from '@/modules/campaigns/campaigns.interface';

export class MembersService {
  constructor(
    private membersDataProvider: MembersDataProvider,
    private campaignsDataProvider: CampaignsDataProvider,
    private usersDataProvider: UsersDataProvider,
  ) {}

  async getMembers(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    offset: number,
    limit: number,
  ): Promise<GetCampaignMembersResponse> {
    const user = await this.usersDataProvider.getCampaignUser(
      userId,
      campaignId,
    );

    if (!user || !user.campaignMemberships.length) {
      throw new AppError({
        description: 'You do not have access to this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const campaignMembers = await this.membersDataProvider.getCampaignMembers(
      campaignId,
      offset,
      limit,
    );

    track(AppEvent.GetCampaignMembers, userId, trackingInfo);

    return {
      data: campaignMembers,
      offset: offset,
      limit: limit,
    };
  }

  async deleteMember(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    memberId: number,
  ): Promise<void> {
    const actingMember = await this.membersDataProvider.getCampaignMember(
      userId,
      campaignId,
    );

    if (!actingMember || actingMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permissions to remove this member.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const deletingMember = await this.membersDataProvider.getCampaignMemberById(
      memberId,
      campaignId,
    );

    if (!deletingMember) {
      throw new AppError({
        description: 'Campaign member not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (deletingMember.role === CampaignRole.DM) {
      throw new AppError({
        description: 'You cannot remove the DM from the campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    await this.membersDataProvider.deleteCampaignMember(memberId, campaignId);
  }
}
