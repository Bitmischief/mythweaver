import { prisma } from '../../../lib/providers/prisma';
import { CampaignConjuration } from '@prisma/client';

export class CampaignConjurationsDataProvider {
  async getCampaignConjuration(
    campaignId: number,
    conjurationId: number,
  ): Promise<CampaignConjuration | null> {
    return await prisma.campaignConjuration.findUnique({
      where: {
        campaignId_conjurationId: {
          campaignId,
          conjurationId,
        },
      },
    });
  }

  async createCampaignConjuration(data: any): Promise<CampaignConjuration> {
    return await prisma.campaignConjuration.create({
      data: data,
    });
  }

  async deleteCampaignConjuration(
    campaignId: number,
    conjurationId: number,
  ): Promise<void> {
    await prisma.campaignConjuration.delete({
      where: {
        campaignId_conjurationId: { campaignId, conjurationId },
      },
    });
  }
}
