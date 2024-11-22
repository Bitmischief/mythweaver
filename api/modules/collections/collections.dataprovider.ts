import { prisma } from '../../lib/providers/prisma';
import { Prisma, CollectionConjuration } from '@prisma/client';
import { Collections, Conjuration } from '@prisma/client';

export class CollectionsDataProvider {
  async getCollection(
    userId: number,
    collectionId: number,
  ): Promise<Collections | null> {
    return await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
      },
    });
  }

  async getCollections(
    userId: number,
    parentId?: number,
    campaignId?: number,
  ): Promise<Collections[]> {
    return await prisma.collections.findMany({
      where: {
        userId: userId,
        parentCollectionId: parentId ? parentId : { equals: null },
        campaignId: campaignId ? campaignId : undefined,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getCollectionTreeByParent(
    userId: number,
    parentId?: number,
  ): Promise<Collections[]> {
    return (await prisma.$queryRawUnsafe(`
            WITH RECURSIVE collection_tree AS (
              SELECT "id", "parentCollectionId", "id" as "ultimateParentId"
              FROM "collections"
              WHERE ${parentId ? `"parentCollectionId" = ${parentId}` : `"parentCollectionId" IS NULL`} AND "userId" = ${userId}
                UNION ALL
                  SELECT c."id", c."parentCollectionId", ct."ultimateParentId"
                  FROM "collections" c
                  INNER JOIN collection_tree ct ON c."parentCollectionId" = ct."id"
            )
            SELECT * FROM collection_tree
          `)) as Collections[];
  }

  async getCollectionTree(userId: number, collectionId: number) {
    return (await prisma.$queryRawUnsafe(`
            WITH RECURSIVE collection_tree AS (
            SELECT "id", "name", "parentCollectionId"
            FROM "collections"
            WHERE "id" = ${collectionId} AND "userId" = ${userId}
                UNION ALL
                    SELECT c."id", c."name", c."parentCollectionId"
                    FROM "collections" c
                    INNER JOIN collection_tree ct ON c."parentCollectionId" = ct."id"
            )
            SELECT * FROM collection_tree
        `)) as Collections[];
  }

  async getManyCollectionsConjurations(collectionIds: number[]): Promise<
    Prisma.CollectionConjurationGetPayload<{
      select: {
        collectionId: true;
        conjuration: { select: { images: { select: { uri: true } } } };
      };
    }>[]
  > {
    return await prisma.collectionConjuration.findMany({
      select: {
        collectionId: true,
        conjuration: {
          select: {
            images: {
              select: {
                uri: true,
              },
              where: {
                primary: true,
              },
              take: 1,
            },
          },
        },
      },
      where: {
        collectionId: {
          in: collectionIds,
        },
      },
    });
  }

  async getConjurationsInCollection(
    collectionId: number,
  ): Promise<Conjuration[]> {
    return await prisma.conjuration.findMany({
      where: {
        collectionConjurations: {
          some: {
            collectionId: collectionId,
          },
        },
      },
      include: {
        collectionConjurations: true,
        images: {
          select: {
            uri: true,
            primary: true,
          },
          where: {
            primary: true,
          },
        },
      },
    });
  }

  async getCollectionConjurations(
    collectionId: number,
  ): Promise<CollectionConjuration[]> {
    return await prisma.collectionConjuration.findMany({
      where: {
        collectionId: collectionId,
      },
    });
  }

  async getCollectionConjuration(
    collectionId: number,
    conjurationId: number,
  ): Promise<CollectionConjuration | null> {
    return await prisma.collectionConjuration.findUnique({
      where: {
        collectionId_conjurationId: {
          collectionId,
          conjurationId,
        },
      },
    });
  }

  async getDistinctCollectionConjurations(
    collectionId: number,
  ): Promise<CollectionConjuration[]> {
    return await prisma.collectionConjuration.findMany({
      where: {
        collectionId: collectionId,
      },
      distinct: ['collectionId'],
    });
  }

  async getCollectionConjurationIdsByCampaignId(
    campaignId: number,
  ): Promise<number[]> {
    const collectionConjurations = await prisma.collectionConjuration.findMany({
      select: {
        conjurationId: true,
      },
      distinct: ['conjurationId'],
      where: {
        collection: {
          campaignId: campaignId,
        },
      },
    });

    return collectionConjurations.map(
      (collectionConjuration) => collectionConjuration.conjurationId,
    );
  }

  async getParentCollection(
    userId: number,
    collectionId: number,
  ): Promise<Collections | null> {
    return await prisma.collections.findFirst({
      where: {
        id: collectionId,
        userId: userId,
      },
    });
  }

  async createCollection(data: any) {
    return await prisma.collections.create({
      data: data,
    });
  }

  async createCollectionConjuration(data: any) {
    return await prisma.collectionConjuration.create({
      data: data,
    });
  }

  async updateCollection(userId: number, collectionId: number, data: any) {
    await prisma.collections.update({
      where: {
        id: collectionId,
        userId: userId,
      },
      data: data,
    });
  }

  async updateCollections(userId: number, collectionIds: number[], data: any) {
    await prisma.collections.updateMany({
      where: {
        id: {
          in: collectionIds,
        },
        userId: userId,
      },
      data: data,
    });
  }

  async updateCollectionConjuration(
    collectionId: number,
    conjurationId: number,
    data: any,
  ) {
    await prisma.collectionConjuration.update({
      where: {
        collectionId_conjurationId: {
          collectionId,
          conjurationId,
        },
      },
      data: data,
    });
  }

  async updateCampaignRootCollections(campaignId: number, data: any) {
    await prisma.collections.updateMany({
      where: {
        campaignId: campaignId,
        parentCollectionId: null,
      },
      data: data,
    });
  }

  async deleteManyCollectionConjurations(collectionIds: number[]) {
    await prisma.collectionConjuration.deleteMany({
      where: {
        collectionId: {
          in: collectionIds,
        },
      },
    });
  }

  async deleteManyCollections(collectionIds: number[]) {
    await prisma.collections.deleteMany({
      where: {
        id: {
          in: collectionIds,
        },
      },
    });
  }

  async deleteManyCollectionsConjuration(conjurationId: number) {
    await prisma.collectionConjuration.deleteMany({
      where: {
        conjurationId: conjurationId,
      },
    });
  }

  async deleteCollectionConjuration(
    collectionId: number,
    conjurationId: number,
  ) {
    await prisma.collectionConjuration.delete({
      where: { collectionId_conjurationId: { collectionId, conjurationId } },
    });
  }
}
