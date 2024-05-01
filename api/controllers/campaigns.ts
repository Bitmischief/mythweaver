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
import { prisma } from '../lib/providers/prisma';
import { Campaign, CampaignMember } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { sendTransactionalEmail } from '../lib/transactionalEmail';
import { v4 as uuidv4 } from 'uuid';
import { urlPrefix } from '../lib/utils';
import { MythWeaverLogger } from '../lib/logger';

export interface GetCampaignsResponse {
  data: Campaign[];
  offset?: number;
  limit?: number;
}

export interface PostCampaignRequest {
  name: string;
  description?: string;
  rpgSystemCode: string;
}

export interface PutCampaignRequest {
  name: string;
  description?: string;
  rpgSystemCode: string;
  publicAdventureCode?: string;
}

export interface GetCampaignMembersResponse {
  data: CampaignMember[];
  offset?: number;
  limit?: number;
}

export enum CampaignRole {
  DM = 1,
  Player = 2,
}

export interface InviteMemberRequest {
  email: string;
}

@Route('campaigns')
@Tags('Campaigns')
export default class CampaignController {
  @Security('jwt')
  @OperationId('getCampaigns')
  @Get('/')
  public async getCampaigns(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() offset = 0,
    @Query() limit = 25,
  ): Promise<GetCampaignsResponse> {
    logger.info('Getting campaigns');

    const campaigns = await prisma.campaign.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    track(AppEvent.GetCampaigns, userId, trackingInfo);

    return {
      data: campaigns,
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('getCampaign')
  @Get('/:campaignId')
  public async getCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
  ): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetCampaign, userId, trackingInfo);

    return campaign;
  }

  @Security('jwt')
  @OperationId('createCampaign')
  @Post('/')
  public async createCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() request: PostCampaignRequest,
  ): Promise<Campaign> {
    track(AppEvent.CreateCampaign, userId, trackingInfo);

    return prisma.campaign.create({
      data: {
        ...request,
        userId,
        members: {
          create: {
            userId,
            role: CampaignRole.DM,
            joinedAt: new Date(),
          },
        },
      },
    });
  }

  @Security('jwt')
  @OperationId('putCampaign')
  @Put('/:campaignId')
  public async putCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
    @Body() request: PutCampaignRequest,
  ): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

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

    return prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        ...campaign,
        ...request,
      },
    });
  }

  @Security('jwt')
  @OperationId('deleteCampaign')
  @Delete('/:campaignId')
  public async deleteCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
  ): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

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

    await prisma.campaign.delete({
      where: {
        id: campaignId,
      },
    });
  }

  @Security('jwt')
  @OperationId('getCampaignMembers')
  @Get('/:campaignId/members')
  public async getCampaignMembers(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
    @Query() offset = 0,
    @Query() limit = 25,
  ): Promise<GetCampaignMembersResponse> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        campaignMemberships: {
          where: {
            campaignId,
          },
        },
      },
    });

    if (!user || !user.campaignMemberships.length) {
      throw new AppError({
        description: 'You do not have access to this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const campaignMembers = await prisma.campaignMember.findMany({
      where: {
        campaignId,
      },
      skip: offset,
      take: limit,
    });

    track(AppEvent.GetCampaignMembers, userId, trackingInfo);

    return {
      data: campaignMembers,
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('inviteCampaignMember')
  @Post('/:campaignId/invite')
  public async inviteCampaignMember(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
    @Body() request: InviteMemberRequest,
  ): Promise<any> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        members: true,
      },
    });

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

    await prisma.campaignMember.create({
      data: {
        campaignId,
        email: request.email,
        inviteCode,
        role: CampaignRole.Player,
      },
    });

    await sendTransactionalEmail(
      'campaign-invite',
      `Join the ${campaign.name} campaign on MythWeaver!`,
      request.email,
      [
        {
          name: 'SENDER_CAMPAIGN',
          content: campaign.name,
        },
        {
          name: 'INVITE_URL',
          content: `${urlPrefix}/invite?c=${inviteCode}`,
        },
      ],
    );
  }

  @Security('jwt')
  @OperationId('deleteCampaignMember')
  @Post('/:campaignId/members/:memberId')
  public async deleteCampaignMember(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
    @Route() memberId = 0,
  ): Promise<any> {
    const actingMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (!actingMember || actingMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permissions to remove this member.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const deletingMember = await prisma.campaignMember.findUnique({
      where: {
        id: memberId,
        campaignId,
      },
    });

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

    await prisma.campaignMember.delete({
      where: {
        id: memberId,
        campaignId,
      },
    });
  }

  @Security('jwt')
  @OperationId('getInvite')
  @Get('/invites/:inviteCode')
  public async getInvite(
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() inviteCode: string,
  ): Promise<any> {
    const invite = await prisma.campaignMember.findUnique({
      where: {
        inviteCode,
      },
      include: {
        campaign: true,
      },
    });

    if (!invite) {
      throw new AppError({
        description: 'Invite not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const otherMembers = await prisma.campaignMember.findMany({
      where: {
        campaignId: invite.campaignId,
      },
      include: {
        user: true,
        character: true,
      },
    });

    return {
      campaignName: invite.campaign.name,
      invitingEmail: otherMembers.filter((m) => m.role === CampaignRole.DM)[0]
        ?.user?.email,
      members: otherMembers
        .filter((m) => m.email !== invite.email)
        .map((m) => ({
          email: m?.email ?? m?.user?.email,
          role: m?.role,
          character: m?.character,
        })),
    };
  }

  @Security('jwt')
  @OperationId('acceptInvite')
  @Put('/invites/:inviteCode')
  public async acceptInvite(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() inviteCode: string,
  ) {
    const invite = await prisma.campaignMember.findUnique({
      where: {
        inviteCode,
      },
    });

    if (!invite) {
      throw new AppError({
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Invite code is invalid',
      });
    }

    await prisma.campaignMember.update({
      where: {
        id: invite.id,
      },
      data: {
        userId: userId,
        inviteCode: null,
        joinedAt: new Date(),
      },
    });
  }

  @Security('jwt')
  @OperationId('getCampaignCharacter')
  @Put('/:campaignId/character/:characterId')
  public async getCampaignCharacter(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
    @Route() characterId: number,
  ) {
    const actingUserCampaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (!actingUserCampaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'You are not a member of this campaign',
      });
    }

    const character = await prisma.character.findUnique({
      where: {
        id: characterId,
        campaignId: campaignId,
      },
      include: {
        images: true,
      },
    });

    if (!character) {
      throw new AppError({
        httpCode: HttpCode.NOT_FOUND,
        description: 'This user does not have a character in this campaign',
      });
    }

    track(AppEvent.GetCharacter, userId, trackingInfo);

    return character;
  }

  @Security('jwt')
  @OperationId('getMyCampaignCharacters')
  @Put('/:campaignId/characters')
  public async getMyCampaignCharacters(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
  ) {
    const actingUserCampaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (!actingUserCampaignMember) {
      throw new AppError({
        httpCode: HttpCode.FORBIDDEN,
        description: 'You are not a member of this campaign',
      });
    }

    const characters = await prisma.character.findMany({
      where: {
        campaignId: campaignId,
      },
      include: {
        images: true,
      },
    });

    track(AppEvent.GetCharacters, campaignId, trackingInfo);

    return characters;
  }
}
