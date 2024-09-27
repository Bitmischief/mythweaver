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
import { Campaign, CampaignMember, ContextType } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { EmailTemplates, sendTransactionalEmail } from '../services/internal/email';
import { v4 as uuidv4 } from 'uuid';
import { urlPrefix } from '../lib/utils';
import { MythWeaverLogger } from '../lib/logger';
import { createCampaign } from '../dataAccess/campaigns';
import { indexCampaignContextQueue } from '../worker';
import { getCampaignCharacters } from '../lib/charactersHelper';
import { getClient } from '../lib/providers/openai';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';

const openai = getClient();

export interface GetCampaignsResponse {
  data: Campaign[];
  offset?: number;
  limit?: number;
}

export interface PostCampaignRequest {
  name: string;
}

export interface PutCampaignRequest {
  name: string;
  description?: string;
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

export interface PostCampaignFileRequest {
  name: string;
  uri: string;
  force: boolean;
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
    @Query() term?: string,
  ): Promise<GetCampaignsResponse> {
    logger.info('Getting campaigns');

    const campaigns = await prisma.campaign.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        name: term
          ? {
              contains: term,
              mode: 'insensitive',
            }
          : undefined,
        deleted: false,
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
    const actingUserCampaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
      include: {
        campaign: true,
      },
    });

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

    const campaign = await createCampaign({
      userId,
      ...request,
    });

    await prisma.collections.create({
      data: {
        name: request.name,
        userId,
        campaignId: campaign.id,
      },
    });

    return campaign;
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

    if (request.description) {
      await indexCampaignContextQueue.add({
        campaignId,
        eventTargetId: campaignId,
        type: ContextType.CAMPAIGN,
      });
    }

    await prisma.collections.updateMany({
      where: {
        campaignId: campaignId,
        parentCollectionId: null,
      },
      data: {
        name: request.name,
      },
    });

    return prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
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

    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        deleted: true,
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

    await sendTransactionalEmail(request.email, EmailTemplates.CAMPAIGN_INVITE, [
      {
        key: 'SENDER_CAMPAIGN',
        value: campaign.name,
      },
      {
        key: 'INVITE_URL',
        value: `${urlPrefix}/invite?c=${inviteCode}`,
      },
    ]);
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
      campaignId: campaign.id,
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
        images: {
          where: {
            primary: true,
          },
        },
      },
    });

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

    const campaignCharacters = await getCampaignCharacters(campaignId);

    track(AppEvent.GetCharacters, campaignId, trackingInfo);

    return campaignCharacters.map((c) => ({
      ...c,
      imageUri: c.images.find((i) => i.primary)?.uri || null,
    }));
  }

  @Security('jwt')
  @OperationId('postCampaignConjuration')
  @Post('/:campaignId/conjurations/:conjurationId')
  public async postCampaignConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
    @Route() conjurationId: number,
  ) {
    track(AppEvent.PostCampaignCampaign, userId, trackingInfo);

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    let campaignConjuration = await prisma.campaignConjuration.findUnique({
      where: {
        campaignId_conjurationId: {
          campaignId,
          conjurationId,
        },
      },
    });

    if (!campaignConjuration) {
      campaignConjuration = await prisma.campaignConjuration.create({
        data: {
          campaignId,
          conjurationId,
        },
      });
    }

    return campaignConjuration;
  }

  @Security('jwt')
  @OperationId('deleteCampaignConjuration')
  @Delete('/:campaignId/conjurations/:conjurationId')
  public async deleteCampaignConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
    @Route() conjurationId: number,
  ) {
    track(AppEvent.DeleteCampaignCampaign, userId, trackingInfo);

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        members: {
          some: {
            userId,
          },
        },
      },
    });

    if (!campaign) {
      throw new AppError({
        description: 'Campaign not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const campaignConjuration = await prisma.campaignConjuration.findUnique({
      where: {
        campaignId_conjurationId: {
          campaignId,
          conjurationId,
        },
      },
    });

    if (campaignConjuration) {
      await prisma.campaignConjuration.delete({
        where: {
          campaignId_conjurationId: {
            campaignId,
            conjurationId,
          },
        },
      });
    }
  }

  @Security('jwt')
  @OperationId('postCampaignFile')
  @Post('/:campaignId/files')
  public async postCampaignFiles(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
    @Body() request: PostCampaignFileRequest,
  ) {
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to add files for this campaign.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    const existingContextFileWithSameName = await prisma.contextFiles.findFirst(
      {
        where: {
          campaignId,
          type: ContextType.MANUAL_FILE_UPLOAD,
          filename: request.name,
        },
      },
    );

    if (existingContextFileWithSameName && !request.force) {
      throw new AppError({
        description: 'A file with that name already exists.',
        httpCode: HttpCode.UNPROCESSABLE_ENTITY,
      });
    }

    await indexCampaignContextQueue.add({
      campaignId,
      eventTargetId: campaignId,
      type: ContextType.MANUAL_FILE_UPLOAD,
      data: {
        fileUpload: {
          name: request.name,
          uri: request.uri,
        },
      },
    });

    await sendWebsocketMessage(userId, WebSocketEvent.CampaignFileUploaded, {
      campaignId,
      filename: request.name,
    });

    track(AppEvent.CampaignFileUploaded, userId, trackingInfo);
  }

  @Security('jwt')
  @OperationId('getCampaignFiles')
  @Get('/:campaignId/files')
  public async getCampaignFiles(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
  ) {
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to get campaign files for this campaign',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.CampaignFileUploaded, userId, trackingInfo);

    return prisma.contextFiles.findMany({
      where: {
        campaignId,
        type: ContextType.MANUAL_FILE_UPLOAD,
      },
    });
  }

  @Security('jwt')
  @OperationId('deleteCampaignFile')
  @Delete('/:campaignId/files/:fileId')
  public async deleteCampaignFile(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() campaignId: number,
    @Route() fileId: number,
  ) {
    const campaignMember = await prisma.campaignMember.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId,
        },
      },
    });

    if (!campaignMember || campaignMember.role !== CampaignRole.DM) {
      throw new AppError({
        description:
          'You do not have permission to delete campaign files for this campaign',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.CampaignFileDeleted, userId, trackingInfo);

    const contextFile = await prisma.contextFiles.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!contextFile) {
      throw new AppError({
        description: 'File not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await openai.files.del(contextFile.externalSystemFileId);

    await prisma.contextFiles.delete({
      where: {
        id: fileId,
      },
    });
  }
}
