import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { TrackingInfo } from '../lib/tracking';
import { MythWeaverLogger } from '../lib/logger';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { Collections, Conjuration } from '@prisma/client';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';
import {
  deleteConjurationContext,
  indexConjurationContext,
} from '../dataAccess/conjurations';

export interface PostCollectionRequest {
  name: string;
  parentId: number;
}

export interface PatchCollectionRequest {
  name: string;
}

export interface PostCollectionConjurationRequest {
  conjurationId: number;
}

export interface PostMoveCollectionConjurationRequest {
  collectionId: number;
}

export interface PostMoveCollectionRequest {
  parentCollectionId: number;
}

@Route('collections')
@Tags('Collections')
export default class CollectionController {
  @Security('jwt')
  @OperationId('getCollections')
  @Get('/')
  public async getCollections(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() parentId?: number,
    @Query() campaignId?: number,
    @Query() conjurationId?: number,
  ) {
    logger.info('Getting collections', { userId, parentId });

    const collections = await prisma.collections.findMany({
      where: {
        userId: userId,
        parentCollectionId: parentId ? parentId : { equals: null },
        campaignId: campaignId ? campaignId : undefined,
      },
      orderBy: {
        name: 'asc',
      },
    });

    const collectionTree = (await prisma.$queryRawUnsafe(`
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

    const collectionConjurations = await prisma.collectionConjuration.findMany({
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
          in: collectionTree.map((c) => c.id),
        },
      },
    });

    let conjurations: Conjuration[] = [];
    if (parentId) {
      conjurations = await prisma.conjuration.findMany({
        where: {
          collectionConjurations: {
            some: {
              collectionId: parentId,
            },
          },
          // images: {
          //   some: {
          //     primary: true,
          //   },
          // },
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

    let conjurationCollections: any[] = [];
    if (conjurationId) {
      conjurationCollections = await prisma.collectionConjuration.findMany({
        where: {
          conjurationId: conjurationId,
        },
        distinct: ['collectionId'],
      });
    }

    return {
      collections: collections.map((col: any) => {
        const children = collectionTree.filter(
          (cc: any) => cc.ultimateParentId === col.id,
        );
        const childConjurations = collectionConjurations
          .filter((cc: any) =>
            children.some((c: any) => c.id === cc.collectionId),
          )
          .slice(0, 4);
        return {
          ...col,
          placeholders: childConjurations
            .map((cc: any) => cc.conjuration.images[0]?.uri)
            .filter((uri: any) => !!uri),
          containsConjuration: conjurationCollections.some(
            (cc: any) => cc.collectionId === col.id,
          ),
        };
      }),
      conjurations,
    };
  }

  @Security('jwt')
  @OperationId('postCollection')
  @Post('/')
  public async postCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() collection: PostCollectionRequest,
  ) {
    const parentCollection = await prisma.collections.findFirst({
      where: {
        id: collection.parentId,
        userId: userId,
      },
    });

    if (!parentCollection) {
      throw new AppError({
        description:
          'Parent collection not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    logger.info('Creating collection', { userId, collection });

    return prisma.collections.create({
      data: {
        name: collection.name,
        parentCollectionId: collection.parentId,
        userId: userId,
        campaignId: parentCollection.campaignId,
      },
    });
  }

  @Security('jwt')
  @OperationId('deleteCollection')
  @Delete('/:collectionId')
  public async deleteCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() collectionId: number,
  ) {
    const collection = await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
      },
    });

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to delete it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionsToDelete = (await prisma.$queryRawUnsafe(`
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

    if (collectionsToDelete && collectionsToDelete.length) {
      logger.info('Deleting collections', { userId, collectionsToDelete });

      await prisma.collectionConjuration.deleteMany({
        where: {
          collectionId: {
            in: collectionsToDelete.map((c: any) => c.id),
          },
        },
      });
      await prisma.collections.deleteMany({
        where: {
          id: {
            in: collectionsToDelete.map((c: any) => c.id),
          },
          userId: userId,
        },
      });
    }
  }

  @Security('jwt')
  @OperationId('deleteCollectionConjuration')
  @Delete('/:collectionId/conjuration/:conjurationId')
  public async deleteCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() collectionId: number,
    @Route() conjurationId: number,
  ) {
    const collection = await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
      },
    });

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to delete it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration = await prisma.collectionConjuration.findUnique(
      {
        where: {
          collectionId_conjurationId: {
            collectionId: collectionId,
            conjurationId: conjurationId,
          },
        },
      },
    );

    if (!collectionConjuration) {
      throw new AppError({
        description: 'Collection conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    logger.info('Deleting collection conjuration', {
      userId,
      collectionId,
      conjurationId,
    });

    await deleteConjurationContext(collection.campaignId, conjurationId);

    await prisma.collectionConjuration.delete({
      where: {
        collectionId_conjurationId: {
          collectionId: collectionId,
          conjurationId: conjurationId,
        },
      },
    });
  }

  @Security('jwt')
  @OperationId('patchCollection')
  @Patch('/:collectionId')
  public async patchCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() collectionId: number,
    @Body() patchCollectionRequest: PatchCollectionRequest,
  ) {
    const collection = await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
        parentCollectionId: {
          not: null,
        },
      },
    });

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    logger.info('Patching collection', {
      userId,
      collectionId,
      patchCollectionRequest,
    });

    await prisma.collections.update({
      where: {
        id: collectionId,
        userId: userId,
      },
      data: patchCollectionRequest,
    });
  }

  @Security('jwt')
  @OperationId('postCollectionConjuration')
  @Post('/:collectionId/conjurations')
  public async postCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() collectionId: number,
    @Body() collectionConjurationRequest: PostCollectionConjurationRequest,
  ) {
    const collection = await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
      },
    });

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to add to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const conjuration = await prisma.conjuration.findUnique({
      where: {
        id: collectionConjurationRequest.conjurationId,
        userId: userId,
      },
    });

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration = await prisma.collectionConjuration.findFirst({
      where: {
        collectionId: collectionId,
        conjurationId: collectionConjurationRequest.conjurationId,
      },
    });

    if (collectionConjuration) {
      return collectionConjuration;
    }

    logger.info('Creating collection conjuration', {
      userId,
      collectionId,
      collectionConjurationRequest,
    });

    const newCollectionCojuration = await prisma.collectionConjuration.create({
      data: {
        collectionId: collectionId,
        conjurationId: collectionConjurationRequest.conjurationId,
      },
    });

    await indexConjurationContext(
      collection.campaignId,
      collectionConjurationRequest.conjurationId,
    );

    return newCollectionCojuration;
  }

  @Security('jwt')
  @OperationId('postMoveCollectionConjuration')
  @Post('/:collectionId/conjurations/:conjurationId/move')
  public async postMoveCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() collectionId: number,
    @Route() conjurationId: number,
    @Body()
    postMoveCollectionConjurationRequest: PostMoveCollectionConjurationRequest,
  ) {
    const fromCollection = await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
      },
    });

    if (!fromCollection) {
      throw new AppError({
        description:
          'From collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const toCollection = await prisma.collections.findUnique({
      where: {
        id: postMoveCollectionConjurationRequest.collectionId,
        userId: userId,
      },
    });

    if (!toCollection) {
      throw new AppError({
        description:
          'To collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration = await prisma.collectionConjuration.findUnique(
      {
        where: {
          collectionId_conjurationId: {
            collectionId: collectionId,
            conjurationId: conjurationId,
          },
        },
      },
    );

    if (!collectionConjuration) {
      throw new AppError({
        description:
          'Collection conjuration not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    logger.info('Posting move collection conjuration', {
      userId,
      postMoveCollectionConjurationRequest,
    });

    await prisma.collectionConjuration.updateMany({
      where: {
        collectionId: collectionId,
        conjurationId: conjurationId,
      },
      data: postMoveCollectionConjurationRequest,
    });

    await deleteConjurationContext(fromCollection.campaignId, conjurationId);

    await indexConjurationContext(
      toCollection.campaignId,
      postMoveCollectionConjurationRequest.collectionId,
    );

    await sendWebsocketMessage(
      userId,
      WebSocketEvent.CollectionConjurationMoved,
      {},
    );
  }

  @Security('jwt')
  @OperationId('postMoveCollection')
  @Post('/:collectionId/move')
  public async postMoveCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() collectionId: number,
    @Body()
    postMoveCollectionRequest: PostMoveCollectionRequest,
  ) {
    const collection = await prisma.collections.findUnique({
      where: {
        id: collectionId,
        userId: userId,
      },
    });

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const parentCollection = await prisma.collections.findUnique({
      where: {
        id: postMoveCollectionRequest.parentCollectionId,
        userId: userId,
      },
    });

    if (!parentCollection) {
      throw new AppError({
        description:
          'Parent collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (
      !collection.parentCollectionId &&
      !parentCollection.parentCollectionId
    ) {
      throw new AppError({
        description:
          'Cannot move root campaign collection into another campaign collection.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    logger.info('Posting move collection', {
      userId,
      postMoveCollectionRequest,
    });

    if (parentCollection.campaignId !== collection.campaignId) {
      const collectionsToUpdate = (await prisma.$queryRawUnsafe(`
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

      if (collectionsToUpdate && collectionsToUpdate.length) {
        logger.info('Updating collections', { userId, collectionsToUpdate });

        await prisma.collections.updateMany({
          where: {
            id: {
              in: collectionsToUpdate.map((c: any) => c.id),
            },
            userId: userId,
          },
          data: {
            campaignId: parentCollection.campaignId,
          },
        });
      }
    }

    await prisma.collections.update({
      where: {
        id: collectionId,
        userId: userId,
      },
      data: {
        parentCollectionId: parentCollection.id,
        campaignId: parentCollection.campaignId,
      },
    });

    await sendWebsocketMessage(userId, WebSocketEvent.CollectionMoved, {});
  }
}
