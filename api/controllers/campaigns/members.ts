import {
  Body,
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
import { AppEvent, track, TrackingInfo } from '../../lib/tracking';
import { MythWeaverLogger } from '../../lib/logger';
import { getCampaignForUser } from '../../dataAccess/campaigns';
import { AppError, HttpCode } from '../../lib/errors/AppError';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../lib/providers/prisma';
import { sendTransactionalEmail } from '../../lib/transactionalEmail';
import { urlPrefix } from '../../lib/utils';
import { getCampaignCharacters } from '../../lib/charactersHelper';
import {
  CampaignRole,
  GetCampaignMembersResponse,
  InviteMemberRequest,
} from './campaigns';

@Route('campaigns/:campaignId/members')
@Tags('Campaigns')
export default class CampaignMembersController {
  @Security('jwt')
  @OperationId('getCampaignMembers')
  @Get('/')
  public async getCampaignMembers(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
    @Query() offset = 0,
    @Query() limit = 25,
  ): Promise<GetCampaignMembersResponse> {
    const campaign = await getCampaignForUser(userId, campaignId);

    if (!campaign) {
      throw new AppError({
        description: "Campaign not found, or you don't have access!",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignMembers = await getCampaignMembers(campaignId, offset, limit);

    track(AppEvent.GetCampaignMembers, userId, trackingInfo);

    return {
      data: campaignMembers,
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('inviteCampaignMember')
  @Post('/invite')
  public async inviteCampaignMember(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId = 0,
    @Body() request: InviteMemberRequest,
  ): Promise<any> {
    const campaign = await getCampaign(campaignId);

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignMembers = await getCampaignMembers(campaignId, 0, 1000);

    const currentMember = campaignMembers.find((m) => m.userId === userId);
    if (!currentMember || currentMember.role !== CampaignRole.DM) {
      throw new AppError({
        description: 'You do not have permissions to invite members.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    if (campaignMembers.find((m) => m.email === request.email)) {
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
  @Post('/:memberId')
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
    const campaign = await prisma.campaign.findFirst({
      where: {
        inviteCode,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        user: true,
      },
    });

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignCharacters = await getCampaignCharacters(campaign.id);

    return {
      campaignName: campaign.name,
      invitingEmail: campaign.user.email,
      members: campaign.members
        .filter((m) => m.email !== campaign.user.email)
        .map((m) => ({
          email: m?.email ?? m?.user?.email,
          username: m?.user?.username,
          role: m?.role,
          character: campaignCharacters.filter((c) => c.userId === m.userId),
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
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        inviteCode,
        deleted: false,
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
        httpCode: HttpCode.BAD_REQUEST,
        description: 'Invite code is invalid',
      });
    }

    if (campaign.members.some((m: any) => m.user?.id === userId)) {
      return;
    }

    await prisma.campaignMember.create({
      data: {
        campaignId: campaign.id,
        email: user.email,
        role: CampaignRole.Player,
        userId: user.id,
      },
    });
  }
}
