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
import { Campaign } from "@prisma/client";
import { AppError, HttpCode } from "../lib/errors/AppError";

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

@Route("campaigns")
@Tags("Campaigns")
export default class CampaignController {
  @Security("jwt")
  @OperationId("getCampaigns")
  @Get("/")
  public async getCampaigns(
    @Inject() userId: number,
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

    return campaign;
  }

  @Security("jwt")
  @OperationId("createCampaign")
  @Post("/")
  public async createCampaign(
    @Inject() userId: number,
    @Body() request: PostCampaignRequest
  ): Promise<Campaign> {
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

    await prisma.campaign.delete({
      where: {
        id: campaignId,
      },
    });
  }
}
