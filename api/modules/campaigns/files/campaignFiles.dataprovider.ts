import { prisma } from '@/providers/prisma';
import { ContextFiles, ContextType } from '@prisma/client';

export class CampaignFilesDataProvider {
  async getCampaignFileById(fileId: number): Promise<ContextFiles | null> {
    return await prisma.contextFiles.findUnique({
      where: { id: fileId },
    });
  }

  async getCampaignFiles(
    campaignId: number,
    type: ContextType,
  ): Promise<ContextFiles[]> {
    return await prisma.contextFiles.findMany({
      where: {
        campaignId,
        type,
      },
    });
  }

  async getCampaignFile(
    campaignId: number,
    fileType: ContextType,
    filename: string,
  ): Promise<ContextFiles | null> {
    return await prisma.contextFiles.findFirst({
      where: {
        campaignId,
        type: fileType,
        filename,
      },
    });
  }

  async deleteCampaignFile(fileId: number): Promise<void> {
    await prisma.contextFiles.delete({ where: { id: fileId } });
  }
}
