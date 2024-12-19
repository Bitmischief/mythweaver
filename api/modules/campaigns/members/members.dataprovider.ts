import { prisma } from '@/providers/prisma';
import { CampaignMember } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class MembersDataProvider {
  async findMemberOfCampaigns(
    userId: number,
    campaignIds: number[],
  ): Promise<CampaignMember | null> {
    return prisma.campaignMember.findFirst({
      where: {
        userId,
        campaignId: {
          in: campaignIds,
        },
      },
    });
  }

  async getCampaignMember(
    userId: number,
    campaignId: number,
  ): Promise<Prisma.CampaignMemberGetPayload<{
    include: { campaign: true };
  }> | null> {
    return await prisma.campaignMember.findUnique({
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
  }

  async getCampaignMemberById(
    memberId: number,
    campaignId: number,
  ): Promise<CampaignMember | null> {
    return await prisma.campaignMember.findUnique({
      where: {
        id: memberId,
        campaignId,
      },
    });
  }

  async getCampaignMembers(
    campaignId: number,
    offset: number,
    limit: number,
  ): Promise<CampaignMember[]> {
    return await prisma.campaignMember.findMany({
      where: {
        campaignId,
      },
      skip: offset,
      take: limit,
    });
  }

  async createCampaignMember(data: any): Promise<void> {
    await prisma.campaignMember.create({
      data: data,
    });
  }

  async deleteCampaignMember(
    memberId: number,
    campaignId: number,
  ): Promise<void> {
    await prisma.campaignMember.delete({
      where: {
        id: memberId,
        campaignId,
      },
    });
  }
}
