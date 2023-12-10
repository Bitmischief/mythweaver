import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Put,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { Collection, ConjurationCollections } from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';

interface GetCollectionsResponse {
  data: Collection[];
  offset?: number;
  limit?: number;
  parentId?: number;
}

interface PatchCollectionRequest {
  name: string;
  description?: string;
}

interface PostCollectionsRequest {
  name: string;
  description: string;
}

interface CreateCollectionConjurationRequest {
  conjurationId: number;
  collectionId: number;
}

interface UpdateCollectionConjurationRequest {
  id: number;
  conjurationId: number;
  collectionId: number;
}

@Route('collections')
@Tags('Collections')
export default class CollectionController {
  @Security('jwt')
  @OperationId('createCollection')
  @Post('/')
  public async postCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: PostCollectionsRequest,
  ): Promise<any> {
    const collection = await prisma.collection.create({
      data: {
        userId,
        ...request,
      },
    });

    track(AppEvent.CreateCollection, userId, trackingInfo);

    return collection;
  }

  @Security('jwt')
  @OperationId('getCollections')
  @Get('/')
  public async getCollections(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() offset?: number,
    @Query() limit?: number,
    @Query() parentId?: any,
  ): Promise<GetCollectionsResponse> {
    const collections = await prisma.collection.findMany({
      where: {
        parentId: parentId ? parentId : null,
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    track(AppEvent.GetCollections, userId, trackingInfo);

    return {
      data: collections,
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
  ): Promise<Collection> {
    const collection = await prisma.collection.findUnique({
      where: {
        id: collectionId,
      },
    });

    if (!collection) {
      throw new AppError({
        description: 'Collection not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    track(AppEvent.GetCollection, userId, trackingInfo);

    return collection;
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

    return prisma.collection.update({
      where: {
        id: collectionId,
      },
      data: {
        userId,
        ...request,
      },
    });
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
  @OperationId('createCollectionConjuration')
  @Post(':collectionId/conjurations')
  public async createCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() request: CreateCollectionConjurationRequest,
  ): Promise<ConjurationCollections> {
    track(AppEvent.CreateCollectionConjuration, userId, trackingInfo);

    return prisma.conjurationCollections.create({
      data: {
        conjurationId: request.conjurationId,
        collectionId: request.collectionId,
      },
    });
  }
}
