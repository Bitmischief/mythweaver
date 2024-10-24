import { prisma } from '../../lib/providers/prisma';
import { Image, User, Conjuration } from '@prisma/client';
import { AppError, HttpCode } from '../../lib/errors/AppError';

export class ImagesDataProvider {
  async findImage(imageId: number): Promise<Image | null> {
    return prisma.image.findUnique({
      where: {
        id: imageId,
      },
    });
  }

  async findUser(userId: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async createImage(data: any): Promise<Image> {
    return prisma.image.create({ data });
  }

  async updateImage(imageId: number, data: any): Promise<Image> {
    return prisma.image.update({
      where: { id: imageId },
      data,
    });
  }

  async updateManyImages(where: any, data: any): Promise<{ count: number }> {
    return prisma.image.updateMany({
      where,
      data,
    });
  }

  async findDefaultImageModel() {
    return prisma.imageModel.findFirst({
      where: { default: true },
    });
  }

  async findImageModel(modelId: number) {
    return prisma.imageModel.findUnique({
      where: { id: modelId },
      include: { artists: true },
    });
  }

  async updateUserArtistContributions(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        amountSupportingArtistsUsd: {
          increment: 0.01,
        },
      },
    });
  }

  async getUserImages(
    userId: number,
    offset: number,
    limit: number,
  ): Promise<Image[]> {
    return prisma.image.findMany({
      where: {
        userId: userId,
        uri: { not: null },
        uploaded: false,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        imageModel: true,
      },
    });
  }

  async countUserImages(userId: number): Promise<number> {
    return prisma.image.count({
      where: {
        userId: userId,
        uri: { not: null },
        uploaded: false,
      },
    });
  }

  async findConjuration(
    conjurationId: number,
    userId: number,
  ): Promise<Conjuration | null> {
    return prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
    });
  }

  async getConjurationImages(conjurationId: number): Promise<Image[]> {
    return prisma.image.findMany({
      where: {
        conjurationId: conjurationId,
        NOT: {
          uri: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        imageModel: true,
      },
    });
  }

  async getConjurationImageHistory(
    userId: number,
    conjurationId: number,
  ): Promise<Image[]> {
    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
      include: {
        images: {
          where: {
            NOT: {
              uri: null,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            imageModel: true,
          },
        },
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    return conjuration.images;
  }
}
