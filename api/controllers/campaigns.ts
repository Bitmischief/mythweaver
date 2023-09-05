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
} from "tsoa";
import { prisma } from "../lib/providers/prisma";
import { Campaign, CampaignMember } from "@prisma/client";
import { AppError, HttpCode } from "../lib/errors/AppError";
import { AppEvent, track, TrackingInfo } from "../lib/tracking";

export interface GetCampaignsResponse {
  data: Campaign[];
  offset?: number;
  limit?: number;
}

export interface PostCampaignRequest {
  name: string;
  description?: string;
  rpgSystemCode: string;
  publicAdventureCode?: string;
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

@Route("campaigns")
@Tags("Campaigns")
export default class CampaignController {
  @Security("jwt")
  @OperationId("getCampaigns")
  @Get("/")
  public async getCampaigns(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset = 0,
    @Query() limit = 25
  ): Promise<GetCampaignsResponse> {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
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

  @Security("jwt")
  @OperationId("getCampaign")
  @Get("/:campaignId")
  public async getCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId = 0
  ): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new AppError({
        description: "Campaign not found",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetCampaign, userId, trackingInfo);

    return campaign;
  }

  @Security("jwt")
  @OperationId("createCampaign")
  @Post("/")
  public async createCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostCampaignRequest
  ): Promise<Campaign> {
    track(AppEvent.CreateCampaign, userId, trackingInfo);

    return prisma.campaign.create({
      data: {
        ...request,
        userId,
      },
    });
  }

  @Security("jwt")
  @OperationId("putCampaign")
  @Put("/:campaignId")
  public async putCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId = 0,
    @Body() request: PutCampaignRequest
  ): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new AppError({
        description: "Campaign not found",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (campaign.userId !== userId) {
      throw new AppError({
        description: "You do not have access to this campaign.",
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

  @Security("jwt")
  @OperationId("deleteCampaign")
  @Delete("/:campaignId")
  public async deleteCampaign(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId: number
  ): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
    });

    if (!campaign) {
      throw new AppError({
        description: "Campaign not found.",
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (campaign.userId !== userId) {
      throw new AppError({
        description: "You do not have access to this campaign.",
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

  @Security("jwt")
  @OperationId("getCampaignMembers")
  @Get("/:campaignId/members")
  public async getCampaignMembers(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() campaignId = 0,
    @Query() offset = 0,
    @Query() limit = 25
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
        description: "You do not have access to this campaign.",
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
}
