import { prisma } from '@/lib/providers/prisma';
import {
  Conjuration,
  ConjurationVisibility,
  ConjurationSave,
  Tag,
  Image,
  Prisma,
} from '@prisma/client';

export class ConjurationsDataProvider {
  async getConjuration(
    userId: number,
    conjurationId: number,
  ): Promise<Conjuration | null> {
    return await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
    });
  }

  async getConjurations(
    userId: number,
    saved?: boolean,
    conjurerCodeString?: string,
    tags?: string,
    offset?: number,
    limit?: number,
    history?: boolean,
    search?: string,
  ): Promise<Conjuration[]> {
    const conjurerCodes = conjurerCodeString
      ?.split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const orClause = [];
    if (tags) {
      orClause.push({
        tags: {
          hasEvery: tags.split(',').map((t) => t.trim()),
        },
      });
    }
    if (search) {
      const t = search.toLowerCase().split(/\s/g);
      t.forEach((term) => {
        orClause.push({
          name: {
            contains: term,
            mode: 'insensitive',
          },
        });
        orClause.push({
          tags: {
            has: term,
          },
        });
      });
    }

    return prisma.conjuration.findMany({
      where: {
        saves: history
          ? undefined
          : saved
            ? {
                some: {
                  userId,
                },
              }
            : undefined,
        conjurerCode: conjurerCodes?.length
          ? {
              in: conjurerCodes,
            }
          : undefined,
        userId: history ? userId : undefined,
        visibility: saved || history ? undefined : ConjurationVisibility.PUBLIC,
        images: !saved
          ? { some: { primary: true, uri: { not: null } } }
          : undefined,
        OR: orClause.length ? orClause : undefined,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        saves: true,
        images: {
          where: {
            primary: true,
          },
          include: {
            imageModel: {
              select: {
                description: true,
              },
            },
          },
        },
      },
    });
  }

  async getConjurationById(
    conjurationId: number,
  ): Promise<Prisma.ConjurationGetPayload<{
    include: { images: { include: { imageModel: true } } };
  }> | null> {
    return prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
      include: {
        images: {
          include: {
            imageModel: true,
          },
        },
      },
    });
  }

  async getQuickConjurations(
    code: string,
    userId: number,
  ): Promise<{ id: number }[]> {
    return prisma.conjuration.findMany({
      where: {
        conjurerCode: code,
        visibility: ConjurationVisibility.PUBLIC,
        NOT: {
          userId,
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: 0,
      take: 1000,
    });
  }

  async getUserConjurationById(
    userId: number,
    conjurationId: number,
  ): Promise<Conjuration | null> {
    return await prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
        userId: userId,
      },
    });
  }

  async getUserConjurationCount(userId: number): Promise<number> {
    return await prisma.conjuration.count({
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            saves: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
    });
  }

  async findUniqueSavedConjuration(
    conjurationId: number,
    userId: number,
  ): Promise<Prisma.ConjurationGetPayload<{
    include: { saves: true; images: { include: { imageModel: true } } };
  }> | null> {
    return prisma.conjuration.findUnique({
      where: {
        id: conjurationId,
      },
      include: {
        saves: {
          where: {
            userId,
          },
        },
        images: {
          include: {
            imageModel: true,
          },
        },
      },
    });
  }

  async upsertConjurationSave(
    userId: number,
    conjurationId: number,
  ): Promise<ConjurationSave> {
    return prisma.conjurationSave.upsert({
      where: {
        userId_conjurationId: {
          userId,
          conjurationId,
        },
      },
      create: {
        userId,
        conjurationId,
      },
      update: {
        userId,
        conjurationId,
      },
    });
  }

  async updateConjuration(
    conjurationId: number,
    data: any,
  ): Promise<Conjuration> {
    return prisma.conjuration.update({
      where: {
        id: conjurationId,
      },
      data,
    });
  }

  async findManyConjurationSaves(
    conjurationId: number,
  ): Promise<ConjurationSave[]> {
    return prisma.conjurationSave.findMany({
      where: {
        conjurationId,
      },
    });
  }

  async deleteConjurationSave(saveId: number): Promise<void> {
    await prisma.conjurationSave.delete({
      where: {
        id: saveId,
      },
    });
  }

  async deleteConjuration(conjurationId: number): Promise<void> {
    await prisma.conjuration.delete({
      where: {
        id: conjurationId,
      },
    });
  }

  async findManyTags(
    term?: string,
    offset?: number,
    limit?: number,
  ): Promise<Tag[]> {
    return prisma.tag.findMany({
      where: {
        name: {
          contains: term,
        },
      },
      orderBy: {
        usageCount: 'desc',
      },
      skip: offset,
      take: limit,
    });
  }

  async findUniqueConjurationSave(
    userId: number,
    conjurationId: number,
  ): Promise<ConjurationSave | null> {
    return prisma.conjurationSave.findUnique({
      where: {
        userId_conjurationId: {
          userId,
          conjurationId,
        },
      },
    });
  }

  async createConjuration(data: any): Promise<Conjuration> {
    return prisma.conjuration.create({
      data,
    });
  }

  async createImage(data: any): Promise<Image> {
    return prisma.image.create({
      data,
    });
  }

  async findUserConjuration(
    userId: number,
    conjurationId: number,
  ): Promise<Conjuration | null> {
    return prisma.conjuration.findFirst({
      where: {
        userId: userId,
        id: conjurationId,
      },
    });
  }
}
