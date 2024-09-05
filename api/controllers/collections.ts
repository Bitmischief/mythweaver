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
import { AppError, HttpCode } from '../lib/errors/AppError';
import { Collections, Conjuration } from '@prisma/client';
import {
  findCollections,
  findCollectionTree,
  findCollectionConjurations,
  findConjurations,
  findConjurationCollections,
  createCollection,
  deleteCollections,
  deleteCollectionConjurations,
  updateCollection,
  createCollectionConjuration,
  updateCollectionConjuration,
} from '../dataAccess/collections';
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

    const collections = await findCollections(userId, parentId, campaignId);

    const collectionTree = await findCollectionTree(userId, parentId);

    const collectionConjurations = await findCollectionConjurations(collectionTree);

    let conjurations: Conjuration[] = [];
    if (parentId) {
      conjurations = await findConjurations(parentId);
    }

    let conjurationCollections: any[] = [];
    if (conjurationId) {
      conjurationCollections = await findConjurationCollections(conjurationId);
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
    const parentCollection = await findCollections(userId, collection.parentId);

    if (!parentCollection) {
      throw new AppError({
        description:
          'Parent collection not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    logger.info('Creating collection', { userId, collection });

    return createCollection(collection, userId, parentCollection.campaignId);
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
    const collection = await findCollections(userId, collectionId);

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to delete it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionsToDelete = await findCollectionTree(userId, collectionId);

    if (collectionsToDelete && collectionsToDelete.length) {
      logger.info('Deleting collections', { userId, collectionsToDelete });

      await deleteCollectionConjurations(collectionsToDelete);
      await deleteCollections(collectionsToDelete, userId);
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
    const collection = await findCollections(userId, collectionId);

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to delete it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration = await findCollectionConjurations(collectionId, conjurationId);

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

    await deleteCollectionConjurations(collectionId, conjurationId);
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
    const collection = await findCollections(userId, collectionId, true);

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

    await updateCollection(collectionId, userId, patchCollectionRequest);
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
    const collection = await findCollections(userId, collectionId);

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to add to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const conjuration = await findConjurations(collectionConjurationRequest.conjurationId, userId);

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration = await findCollectionConjurations(collectionId, collectionConjurationRequest.conjurationId);

    if (collectionConjuration) {
      return collectionConjuration;
    }

    logger.info('Creating collection conjuration', {
      userId,
      collectionId,
      collectionConjurationRequest,
    });

    const newCollectionCojuration = await createCollectionConjuration(collectionId, collectionConjurationRequest.conjurationId);

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
    const fromCollection = await findCollections(userId, collectionId);

    if (!fromCollection) {
      throw new AppError({
        description:
          'From collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const toCollection = await findCollections(userId, postMoveCollectionConjurationRequest.collectionId);

    if (!toCollection) {
      throw new AppError({
        description:
          'To collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration = await findCollectionConjurations(collectionId, conjurationId);

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

    await updateCollectionConjuration(collectionId, conjurationId, postMoveCollectionConjurationRequest);

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
    const collection = await findCollections(userId, collectionId);

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const parentCollection = await findCollections(userId, postMoveCollectionRequest.parentCollectionId);

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
      const collectionsToUpdate = await findCollectionTree(userId, collectionId);

      if (collectionsToUpdate && collectionsToUpdate.length) {
        logger.info('Updating collections', { userId, collectionsToUpdate });

        await updateCollection(collectionsToUpdate, parentCollection.campaignId);
      }
    }

    await updateCollection(collectionId, userId, {
      parentCollectionId: parentCollection.id,
      campaignId: parentCollection.campaignId,
    });

    await sendWebsocketMessage(userId, WebSocketEvent.CollectionMoved, {});
  }
}

