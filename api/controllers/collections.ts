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
import { Conjuration, Image } from '@prisma/client';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';

export interface PostCollectionRequest {
  name: string;
  parentId?: number;
}

export interface PatchCollectionRequest {
  name: string;
}

export interface PostCollectionConjurationRequest {
  conjurationId: number;
}

export interface PostMoveCollectionConjurationRequest {
  collectionId: number;
  conjurationId: number;
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
  ) {
    logger.info('Getting collections', { userId, parentId });

    const collections = await prisma.collections.findMany({
      where: {
        userId: userId,
        parentCollectionId: parentId ? parentId : { equals: null },
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        collectionConjurations: {
          include: {
            conjuration: {
              include: {
                images: {
                  where: {
                    primary: true,
                  },
                },
              },
            },
          },
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
        },
        include: {
          collectionConjurations: true,
          images: {
            where: {
              primary: true,
            },
          },
        },
      });
    }

    return {
      collections: collections.map((col: any) => {
        const placeholders = col.collectionConjurations.map(
          (cc: any) => cc.conjuration.images.find((i: Image) => i.primary)?.uri,
        );
        return {
          ...col,
          placeholders,
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
    logger.info('Creating collection', { userId, collection });

    return prisma.collections.create({
      data: {
        name: collection.name,
        parentCollectionId: collection.parentId,
        userId: userId,
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

    logger.info('Deleting collection', { userId, collectionId });

    await prisma.collections.delete({
      where: {
        id: collectionId,
        userId: userId,
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

    return prisma.collectionConjuration.create({
      data: {
        collectionId: collectionId,
        conjurationId: collectionConjurationRequest.conjurationId,
      },
    });
  }

  @Security('jwt')
  @OperationId('postMoveCollectionConjuration')
  @Post('/conjurations/move')
  public async postMoveCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body()
    postMoveCollectionConjurationRequest: PostMoveCollectionConjurationRequest,
  ) {
    const collection = await prisma.collections.findUnique({
      where: {
        id: postMoveCollectionConjurationRequest.collectionId,
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

    if (!collection.parentCollectionId) {
      throw new AppError({
        description: 'Moving conjurations from this collection is not allowed.',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    logger.info('Posting move collection conjuration', {
      userId,
      postMoveCollectionConjurationRequest,
    });

    await prisma.collectionConjuration.updateMany({
      where: {
        collectionId: collection.parentCollectionId,
        conjurationId: postMoveCollectionConjurationRequest.conjurationId,
      },
      data: postMoveCollectionConjurationRequest,
    });

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

    logger.info('Posting move collection', {
      userId,
      postMoveCollectionRequest,
    });

    await prisma.collections.update({
      where: {
        id: collectionId,
        userId: userId,
      },
      data: {
        parentCollectionId: postMoveCollectionRequest.parentCollectionId,
      },
    });

    await sendWebsocketMessage(userId, WebSocketEvent.CollectionMoved, {});
  }
}
