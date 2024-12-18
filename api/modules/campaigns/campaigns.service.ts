import { CampaignsDataProvider } from '@/modules/campaigns/campaigns.dataprovider';
import { MembersDataProvider } from '@/modules/campaigns/members/members.dataprovider';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { UsersDataProvider } from '@/modules/users/users.dataprovider';
import { CharactersDataProvider } from '@/modules/campaigns/characters/characters.dataprovider';
import { MythWeaverLogger } from '@/lib/logger';
import {
  GetCampaignsResponse,
  PostCampaignRequest,
  PutCampaignRequest,
  InviteMemberRequest,
} from '@/modules/campaigns/campaigns.interface';
import { TrackingInfo, AppEvent, track } from '@/lib/tracking';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import { Campaign, ContextType, Character, Conjuration } from '@prisma/client';
import { createCampaign } from '@/dataAccess/campaigns';
import { v4 as uuidv4 } from 'uuid';
import { urlPrefix } from '@/lib/utils';
import { CampaignRole } from '@/modules/campaigns/campaigns.interface';
import { getCampaignCharacters } from '@/lib/charactersHelper';
import { EmailProvider, EmailTemplates } from '@/providers/emailProvider';
import { CampaignContextWorker } from '../context/workers/campaignContext.worker';

export class CampaignsService {
  constructor(
    private campaignsDataProvider: CampaignsDataProvider,
    private membersDataProvider: MembersDataProvider,
    private collectionsDataProvider: CollectionsDataProvider,
    private usersDataProvider: UsersDataProvider,
    private charactersDataProvider: CharactersDataProvider,
    private emailProvider: EmailProvider,
    private indexCampaignContextWorker: CampaignContextWorker,
    private logger: MythWeaverLogger,
  ) {}

  async getCampaigns(
    userId: number,
    trackingInfo: TrackingInfo,
    offset: number,
    limit: number,
    term?: string,
  ): Promise<GetCampaignsResponse> {
    this.logger.info('Getting campaigns');

    const campaigns = await this.campaignsDataProvider.getCampaigns(
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

  async getCampaign(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
  ): Promise<Campaign> {
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

    const campaign = await this.campaignsDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetCampaign, userId, trackingInfo);

    return campaign;
  }

  async createCampaign(
    userId: number,
    trackingInfo: TrackingInfo,
    request: PostCampaignRequest,
  ): Promise<Campaign> {
    const campaign = await createCampaign({
      userId,
      ...request,
    });

    await this.campaignsDataProvider.createCampaign({
      name: request.name,
      userId,
      campaignId: campaign.id,
    });

    return campaign;
  }

  async updateCampaign(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    request: PutCampaignRequest,
  ): Promise<Campaign> {
    const campaign = await this.campaignsDataProvider.getCampaign(campaignId);

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
      await this.indexCampaignContextWorker.addJob({
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

    return await this.campaignsDataProvider.updateCampaign(campaignId, {
      ...request,
    });
  }

  async deleteCampaign(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
  ): Promise<void> {
    const campaign = await this.campaignsDataProvider.getCampaign(campaignId);

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

    await this.campaignsDataProvider.deleteCampaign(campaignId);
  }

  async inviteCampaignMember(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    request: InviteMemberRequest,
  ): Promise<any> {
    const campaign = await this.campaignsDataProvider.getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const currentMember = campaign.members.find((m) => m.userId === userId);
    if (!currentMember || currentMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permissions to invite members.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    if (campaign.members.find((m) => m.email === request.email)) {
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
      await this.campaignsDataProvider.getCampaignByInviteCode(inviteCode);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignCharacters = await getCampaignCharacters(campaign.id);

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
          character: campaignCharacters.filter((c) => c.userId === m.userId),
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
      await this.campaignsDataProvider.getCampaignByInviteCode(inviteCode);

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

  async getCampaignCharacter(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId: number,
    characterId: number,
  ): Promise<Character & { imageUri: string | null }> {
    const actingUserCampaignMember =
      await this.membersDataProvider.getCampaignMember(userId, campaignId);

    if (!actingUserCampaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'You are not a member of this campaign',
      });
    }

    const character = await this.charactersDataProvider.getCampaignCharacters(
      characterId,
      campaignId,
    );

    if (!character) {
      throw new AppError({
        httpCode: HttpCode.NOT_FOUND,
        description: 'This user does not have a character in this campaign',
      });
    }

    track(AppEvent.GetCharacter, userId, trackingInfo);

    return {
      ...character,
      imageUri: character.images.find((i) => i.primary)?.uri || null,
    };
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

    const campaignCharacters = await getCampaignCharacters(campaignId);

    track(AppEvent.GetCharacters, campaignId, trackingInfo);

    return campaignCharacters.map((c: any) => ({
      ...c,
      imageUri: c.images.find((i: any) => i.primary)?.uri || null,
    }));
  }
}
