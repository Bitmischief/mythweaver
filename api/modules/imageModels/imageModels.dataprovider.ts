import { prisma } from '../../lib/providers/prisma';

export class ImageModelsDataProvider {
  async getImageModels(offset: number, limit: number): Promise<any[]> {
    return prisma.imageModel.findMany({
      include: {
        artists: {
          select: {
            artist: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });
  }
}
