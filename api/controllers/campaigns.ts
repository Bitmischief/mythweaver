import {
  Body,
  Get,
  Inject,
  OperationId,
  Post,
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
}
