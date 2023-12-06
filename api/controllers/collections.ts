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
import { prisma } from '../lib/providers/prisma';
import { Collection } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import { processTagsQueue } from '../worker';
import { ImageStylePreset } from './images';

interface GetCollectionsResponse {
  data: (Collection & { saved: boolean })[];
  offset?: number;
  limit?: number;
  parentId?: number;
}

interface GetCollectionTagsResponse {
  data: string[];
  offset?: number;
  limit?: number;
}

interface PatchCollectionRequest {
  campaignId: number;
  name: string;
  description?: string;
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
    @Query() saved?: boolean,
    @Query() offset?: number,
    @Query() limit?: number,
    @Query() parentId?: any,
  ): Promise<GetCollectionsResponse> {
    const collections = await prisma.collection.findMany({
      where: {
        saves: saved
          ? {
              some: {
                userId,
              },
            }
          : undefined,
        parentId: parentId ? parentId : null,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        saves: {
          where: {
            userId,
          },
        },
      },
    });

    track(AppEvent.GetCollections, userId, trackingInfo);

    return {
      data: collections.map((c) => ({
        ...c,
        saves: undefined,
        saved: c.saves.length > 0,
      })),
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('getCollection')
  @Get('/:collectionId')
  public async getCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() collectionId = 0,
  ): Promise<Collection & { saves: undefined; saved: boolean }> {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
      include: {
        saves: {
          where: {
            userId,
          },
        },
      },
    });

    if (!collection) {
      throw new AppError({
        description: 'Collection not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetCollection, userId, trackingInfo);

    return {
      ...collection,
      saves: undefined,
      saved: collection.saves.length > 0,
    };
  }

  @Security('jwt')
  @OperationId('saveCollection')
  @Post('/:collectionId/save')
  public async postSaveCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() collectionId: number,
    @Inject() parentId: number,
  ): Promise<void> {
    const existingCollection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
    });

    if (!existingCollection) {
      throw new AppError({
        description: 'Collection not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (!existingCollection.published && existingCollection.userId !== userId) {
      throw new AppError({
        description: 'You cannot save this collection!',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.SaveCollection, userId, trackingInfo);

    await prisma.collectionSave.upsert({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
      create: {
        userId,
        collectionId,
        parentId,
      },
      update: {
        userId,
        collectionId,
      },
    });
  }

  @Security('jwt')
  @OperationId('updateCollection')
  @Patch('/:collectionId')
  public async patchCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() collectionId: number,
    @Body() request: PatchCollectionRequest,
  ): Promise<Collection> {
    const collection = await this.getCollection(
      userId,
      trackingInfo,
      collectionId,
    );

    if (collection.userId === null || collection.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to modify this collection.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.UpdateCollection, userId, trackingInfo);

    const updatedCollection = prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        userId,
        ...request,
      },
    });

    return updatedCollection;
  }

  @Security('jwt')
  @OperationId('deleteCollection')
  @Delete('/:collectionId')
  public async deleteCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() collectionId: number,
  ): Promise<boolean> {
    const collection = await this.getCollection(
      userId,
      trackingInfo,
      collectionId,
    );

    if (collection.userId === null || collection.userId !== userId) {
      throw new AppError({
        description: 'You do not have access to delete this collection.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    track(AppEvent.DeleteCollection, userId, trackingInfo);

    await prisma.collection.delete({
      where: {
        id: collectionId,
      },
    });

    return true;
  }

  @Security('jwt')
  @OperationId('getCollectionTags')
  @Get('/tags')
  public async getCollectionTags(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() term?: string,
    @Query() offset?: number,
    @Query() limit?: number,
  ): Promise<GetCollectionTagsResponse> {
    offset = offset || 0;
    limit = limit || 50;

    const tags = await prisma.tag.findMany({
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

    track(AppEvent.GetCollectionTags, userId, trackingInfo);

    return {
      data: tags.map((t) => t.name),
      offset: offset,
      limit: limit,
    };
  }

  @Security('jwt')
  @OperationId('removeCollection')
  @Post('/:collectionId/remove')
  public async postRemoveCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() collectionId: number,
  ): Promise<void> {
    const existingCollectionSave = await prisma.collectionSave.findUnique({
      where: {
        userId_collectionId: {
          userId,
          collectionId,
        },
      },
    });

    if (!existingCollectionSave) {
      throw new AppError({
        description: 'Collection save not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.RemoveCollection, userId, trackingInfo);

    await prisma.collectionSave.delete({
      where: {
        id: existingCollectionSave.id,
      },
    });
  }

  @Security('jwt')
  @OperationId('copyCollection')
  @Post('/:collectionId/copy')
  public async postCopyCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Route() collectionId: number,
  ): Promise<any> {
    const existingCollection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
    });

    if (!existingCollection) {
      throw new AppError({
        description: 'Collection not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.CopyCollection, userId, trackingInfo);

    return prisma.collection.create({
      data: {
        ...existingCollection,
        id: undefined,
        description: existingCollection.description as any,
        userId,
      },
    });
  }
}
