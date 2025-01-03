import { prisma } from '@/providers/prisma';
import { Campaign } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PostCampaignRequest } from './campaign.interface';

export class CampaignDataProvider {
  async getCampaigns(
    userId: number,
    offset: number,
    limit: number,
    term?: string,
  ): Promise<Campaign[]> {
    return await prisma.campaign.findMany({
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
  }

  async getCampaign(campaignId: number): Promise<Prisma.CampaignGetPayload<{
    include: { members: { include: { user: true } }; user: true };
  }> | null> {
    return await prisma.campaign.findUnique({
      where: {
        id: campaignId,
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
  }

  async getUserCampaign(
    userId: number,
    campaignId: number,
  ): Promise<Campaign | null> {
    return await prisma.campaign.findUnique({
      where: {
        id: campaignId,
        members: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async getCampaignByInviteCode(
    inviteCode: string,
  ): Promise<Prisma.CampaignGetPayload<{
    include: { members: { include: { user: true } }; user: true };
  }> | null> {
    return await prisma.campaign.findFirst({
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
        user: true,
      },
    });
  }

  async createCampaign(
    userId: number,
    data: PostCampaignRequest,
  ): Promise<Campaign> {
    return prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description || '',
        rpgSystemCode: data.rpgSystemCode || 'dnd5e',
        userId: userId,
      },
    });
  }

  async updateCampaign(
    campaignId: number,
    data: Prisma.CampaignUpdateInput,
  ): Promise<Campaign> {
    return await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data,
    });
  }

  async deleteCampaign(campaignId: number): Promise<void> {
    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: {
        deleted: true,
      },
    });
  }
}
