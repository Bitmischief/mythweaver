import { CampaignDataProvider } from '@/modules/campaigns/campaign.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { Logger } from '@/modules/core/logging/logger';
import {
  GetCampaignsResponse,
  PostCampaignRequest,
  InviteMemberRequest,
} from '@/modules/campaigns/campaign.interface';
import {
  TrackingInfo,
  AppEvent,
  track,
} from '@/modules/core/analytics/tracking';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';
import { Campaign, ContextType, Conjuration, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { urlPrefix } from '@/modules/core/utils/environments';
import { CampaignRole } from '@/modules/campaigns/campaign.interface';
import { EmailProvider, EmailTemplates } from '@/providers/emailProvider';
import { CollectionsService } from '@/modules/collections/collections.service';
import { prisma } from '@/providers/prisma';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import {
  CampaignContextConfig,
  ReindexCampaignContextEvent,
} from '@/modules/context/context.interface';
import { Queue } from 'bull';

export class CampaignService {
  constructor(
    private campaignDataProvider: CampaignDataProvider,
    private membersDataProvider: MembersDataProvider,
    private collectionsDataProvider: CollectionsDataProvider,
    private usersDataProvider: UsersDataProvider,
    private conjurationsDataProvider: ConjurationsDataProvider,
    private emailProvider: EmailProvider,
    private collectionsService: CollectionsService,
    private logger: Logger,
    private indexCampaignContextQueue: Queue<ReindexCampaignContextEvent>,
  ) {}

  async getCampaigns(
    userId: number,
    trackingInfo: TrackingInfo,
    offset: number,
    limit: number,
    term?: string,
  ): Promise<GetCampaignsResponse> {
    this.logger.info('Getting campaigns');

    const campaigns = await this.campaignDataProvider.getCampaigns(
      userId,
      offset,
      limit,
      term,
    );

    track(AppEvent.GetCampaigns, userId, trackingInfo);

    return {
      data: campaigns,
      offset: offset,
      limit: limit,
    };
  }

  async getCampaign(userId: number, campaignId: number): Promise<Campaign> {
    const actingUserCampaignMember =
      await this.membersDataProvider.getCampaignMember(userId, campaignId);

    if (!actingUserCampaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'You are not a member of this campaign.',
      });
    }

    if (actingUserCampaignMember.campaign.deleted) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'This campaign has been deleted.',
      });
    }

    const campaign = await this.campaignDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    return campaign;
  }

  async createCampaign(
    userId: number,
    request: PostCampaignRequest,
  ): Promise<Campaign> {
    const campaign = await this.campaignDataProvider.createCampaign(
      userId,
      request,
    );

    await this.membersDataProvider.createCampaignMember({
      campaignId: campaign.id,
      userId,
      role: CampaignRole.DM,
      joinedAt: new Date(),
    });

    await this.collectionsService.createCollection(userId, {
      name: campaign.name,
      parentId: null,
      campaignId: campaign.id,
    });

    return campaign;
  }

  async updateCampaign(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    request: Prisma.CampaignUpdateInput,
  ): Promise<Campaign> {
    const campaign = await this.campaignDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (campaign.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to modify this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.UpdateCampaign, userId, trackingInfo);

    if (request.description) {
      await this.indexCampaignContextQueue.add({
        campaignId,
        eventTargetId: campaignId,
        type: ContextType.CAMPAIGN,
      });
    }

    await this.collectionsDataProvider.updateCampaignRootCollections(
      campaignId,
      {
        name: request.name,
      },
    );

    return await this.campaignDataProvider.updateCampaign(campaignId, {
      ...request,
    });
  }

  async deleteCampaign(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
  ): Promise<void> {
    const campaign = await this.campaignDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (campaign.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to modify this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.DeleteCampaign, userId, trackingInfo);

    await this.campaignDataProvider.deleteCampaign(campaignId);
  }

  async inviteCampaignMember(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    request: InviteMemberRequest,
  ): Promise<any> {
    const campaign = await this.campaignDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const currentMember = campaign.members.find(
      (m: any) => m.userId === userId,
    );
    if (!currentMember || currentMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permissions to invite members.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    if (campaign.members.find((m: any) => m.email === request.email)) {
      throw new AppError({
        description: 'User is already a member of this campaign.',
        httpCode: HttpCode.CONFLICT,
      });
    }

    const inviteCode = uuidv4();

    await this.membersDataProvider.createCampaignMember({
      campaignId,
      email: request.email,
      inviteCode,
      role: CampaignRole.Player,
    });

    await this.emailProvider.sendTransactionalEmail(
      request.email,
      EmailTemplates.CAMPAIGN_INVITE,
      [
        {
          key: 'SENDER_CAMPAIGN',
          value: campaign.name,
        },
        {
          key: 'INVITE_URL',
          value: `${urlPrefix}/invite?c=${inviteCode}`,
        },
      ],
    );
  }

  async getInvite(inviteCode: string): Promise<any> {
    const campaign =
      await this.campaignDataProvider.getCampaignByInviteCode(inviteCode);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignCharacters =
      await this.conjurationsDataProvider.getCharacterCampaigns(campaign.id);

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      invitingEmail: campaign.user.email,
      members: campaign.members
        .filter((m: any) => m.email !== campaign.user.email)
        .map((m: any) => ({
          email: m?.email ?? m?.user?.email,
          username: m?.user?.username,
          role: m?.role,
          character: campaignCharacters.filter(
            (c: any) => c.userId === m.userId,
          ),
        })),
    };
  }

  async acceptInvite(
    userId: number,
    trackingInfo: TrackingInfo,
    inviteCode: string,
  ): Promise<void> {
    const user = await this.usersDataProvider.getUserById(userId);

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaign =
      await this.campaignDataProvider.getCampaignByInviteCode(inviteCode);

    if (!campaign) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Invite code is invalid',
      });
    }

    if (campaign.members.some((m: any) => m.user?.id === userId)) {
      return;
    }

    await this.membersDataProvider.createCampaignMember({
      campaignId: campaign.id,
      email: user.email,
      role: CampaignRole.Player,
      userId: user.id,
      joinedAt: new Date(),
    });
  }

  async getMyCampaignCharacters(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
  ): Promise<(Conjuration & { imageUri: string })[]> {
    const actingUserCampaignMember =
      await this.membersDataProvider.getCampaignMember(userId, campaignId);

    if (!actingUserCampaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'You are not a member of this campaign',
      });
    }

    const campaignCharacters =
      await this.conjurationsDataProvider.getCharactersInCampaign(campaignId);

    track(AppEvent.GetCharacters, campaignId, trackingInfo);

    return campaignCharacters.map((c: any) => ({
      ...c,
      imageUri: c.images.find((i: any) => i.primary)?.uri || null,
    }));
  }

  async getCampaignContextConfig(
    campaignId: number,
  ): Promise<CampaignContextConfig> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    return campaign?.openAiConfig as unknown as CampaignContextConfig;
  }
}
