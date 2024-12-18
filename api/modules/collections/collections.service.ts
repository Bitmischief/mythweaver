import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import { ConjurationsDataProvider } from '@/modules/conjurations/conjurations.dataprovider';
import {
  PostCollectionRequest,
  PatchCollectionRequest,
  PostCollectionConjurationRequest,
  PostMoveCollectionConjurationRequest,
  PostMoveCollectionRequest,
} from '@/modules/collections/collections.interface';
import { MythWeaverLogger } from '@/lib/logger';
import { Conjuration } from '@prisma/client';
import { TrackingInfo } from '@/lib/tracking';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import {
  WebSocketEvent,
  WebSocketProvider,
} from '@/providers/websocketProvider';
import {
  deleteConjurationContext,
  indexConjurationContext,
} from '@/dataAccess/conjurations';

export class CollectionsService {
  constructor(
    private collectionsDataProvider: CollectionsDataProvider,
    private conjurationsDataProvider: ConjurationsDataProvider,
    private logger: MythWeaverLogger,
    private webSocketProvider: WebSocketProvider,
  ) {}

  async getCollections(
    userId: number,
    trackingInfo: TrackingInfo,
    parentId?: number,
    campaignId?: number,
    conjurationId?: number,
  ) {
    this.logger.info('Getting collections', { userId, parentId });

    const collections = await this.collectionsDataProvider.getCollections(
      userId,
      parentId,
      campaignId,
    );
    const collectionTree =
      await this.collectionsDataProvider.getCollectionTreeByParent(
        userId,
        parentId,
      );
    const collectionConjurations =
      await this.collectionsDataProvider.getManyCollectionsConjurations(
        collectionTree.map((c) => c.id),
      );

    let conjurations: Conjuration[] = [];
    if (parentId) {
      conjurations =
        await this.collectionsDataProvider.getConjurationsInCollection(
          parentId,
        );
    }

    let conjurationCollections: any[] = [];
    if (conjurationId) {
      conjurationCollections =
        await this.collectionsDataProvider.getDistinctCollectionConjurations(
          conjurationId,
        );
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

  async createCollection(
    userId: number,
    trackingInfo: TrackingInfo,
    collection: PostCollectionRequest,
  ) {
    const parentCollection =
      await this.collectionsDataProvider.getParentCollection(
        userId,
        collection.parentId,
      );

    if (!parentCollection) {
      throw new AppError({
        description:
          'Parent collection not found or you do not have access to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    this.logger.info('Creating collection', { userId, collection });

    return this.collectionsDataProvider.createCollection({
      name: collection.name,
      parentCollectionId: collection.parentId,
      userId: userId,
      campaignId: parentCollection.campaignId,
    });
  }

  async deleteCollection(
    userId: number,
    trackingInfo: TrackingInfo,
    collectionId: number,
  ) {
    const collection = await this.collectionsDataProvider.getCollection(
      userId,
      collectionId,
    );

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to delete it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionsToDelete =
      await this.collectionsDataProvider.getCollectionTree(
        userId,
        collectionId,
      );

    if (collectionsToDelete && collectionsToDelete.length) {
      this.logger.info('Deleting collections', { userId, collectionsToDelete });

      await this.collectionsDataProvider.deleteManyCollectionConjurations(
        collectionsToDelete.map((c: any) => c.id),
      );
      await this.collectionsDataProvider.deleteManyCollections(
        collectionsToDelete.map((c: any) => c.id),
      );
    }
  }

  async deleteCollectionConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    collectionId: number,
    conjurationId: number,
  ) {
    const collection = await this.collectionsDataProvider.getCollection(
      userId,
      collectionId,
    );

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to delete it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration =
      await this.collectionsDataProvider.getCollectionConjuration(
        collectionId,
        conjurationId,
      );

    if (!collectionConjuration) {
      throw new AppError({
        description: 'Collection conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    this.logger.info('Deleting collection conjuration', {
      userId,
      collectionId,
      conjurationId,
    });

    await deleteConjurationContext(collection.campaignId, conjurationId);

    await this.collectionsDataProvider.deleteCollectionConjuration(
      collectionId,
      conjurationId,
    );
  }

  async updateCollection(
    userId: number,
    trackingInfo: TrackingInfo,
    collectionId: number,
    request: PatchCollectionRequest,
  ) {
    const collection = await this.collectionsDataProvider.getCollection(
      userId,
      collectionId,
    );

    if (!collection || !collection.parentCollectionId) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    this.logger.info('Patching collection', {
      userId,
      collectionId,
      request,
    });

    await this.collectionsDataProvider.updateCollection(
      userId,
      collectionId,
      request,
    );
  }

  async createCollectionConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    collectionId: number,
    collectionConjurationRequest: PostCollectionConjurationRequest,
  ) {
    const collection = await this.collectionsDataProvider.getCollection(
      userId,
      collectionId,
    );

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to add to it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const conjuration = await this.conjurationsDataProvider.getConjuration(
      userId,
      collectionConjurationRequest.conjurationId,
    );

    if (!conjuration) {
      throw new AppError({
        description: 'Conjuration not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration =
      await this.collectionsDataProvider.getCollectionConjuration(
        collectionId,
        collectionConjurationRequest.conjurationId,
      );

    if (collectionConjuration) {
      return collectionConjuration;
    }

    this.logger.info('Creating collection conjuration', {
      userId,
      collectionId,
      collectionConjurationRequest,
    });

    const newCollectionCojuration =
      await this.collectionsDataProvider.createCollectionConjuration({
        collectionId: collectionId,
        conjurationId: collectionConjurationRequest.conjurationId,
      });

    await indexConjurationContext(
      collection.campaignId,
      collectionConjurationRequest.conjurationId,
    );

    return newCollectionCojuration;
  }

  async moveCollectionConjuration(
    userId: number,
    trackingInfo: TrackingInfo,
    collectionId: number,
    conjurationId: number,
    postMoveCollectionConjurationRequest: PostMoveCollectionConjurationRequest,
  ) {
    const fromCollection = await this.collectionsDataProvider.getCollection(
      userId,
      collectionId,
    );

    if (!fromCollection) {
      throw new AppError({
        description:
          'From collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const toCollection = await this.collectionsDataProvider.getCollection(
      userId,
      postMoveCollectionConjurationRequest.collectionId,
    );

    if (!toCollection) {
      throw new AppError({
        description:
          'To collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const collectionConjuration =
      await this.collectionsDataProvider.getCollectionConjuration(
        collectionId,
        conjurationId,
      );

    if (!collectionConjuration) {
      throw new AppError({
        description:
          'Collection conjuration not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    this.logger.info('Posting move collection conjuration', {
      userId,
      postMoveCollectionConjurationRequest,
    });

    await this.collectionsDataProvider.updateCollectionConjuration(
      collectionId,
      conjurationId,
      postMoveCollectionConjurationRequest,
    );

    await deleteConjurationContext(fromCollection.campaignId, conjurationId);

    await indexConjurationContext(
      toCollection.campaignId,
      postMoveCollectionConjurationRequest.collectionId,
    );

    await this.webSocketProvider.sendMessage(
      userId,
      WebSocketEvent.CollectionConjurationMoved,
      {},
    );
  }

  async moveCollection(
    userId: number,
    trackingInfo: TrackingInfo,
    collectionId: number,
    postMoveCollectionRequest: PostMoveCollectionRequest,
  ) {
    const collection = await this.collectionsDataProvider.getCollection(
      userId,
      collectionId,
    );

    if (!collection) {
      throw new AppError({
        description:
          'Collection not found or you do not have access to update it.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    const parentCollection = await this.collectionsDataProvider.getCollection(
      userId,
      postMoveCollectionRequest.parentCollectionId,
    );

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

    this.logger.info('Posting move collection', {
      userId,
      postMoveCollectionRequest,
    });

    if (parentCollection.campaignId !== collection.campaignId) {
      const collectionsToUpdate =
        await this.collectionsDataProvider.getCollectionTree(
          userId,
          collectionId,
        );

      if (collectionsToUpdate && collectionsToUpdate.length) {
        this.logger.info('Updating collections', {
          userId,
          collectionsToUpdate,
        });

        await this.collectionsDataProvider.updateCollections(
          userId,
          collectionsToUpdate.map((c: any) => c.id),
          {
            campaignId: parentCollection.campaignId,
          },
        );
      }
    }

    await this.collectionsDataProvider.updateCollection(userId, collectionId, {
      parentCollectionId: parentCollection.id,
      campaignId: parentCollection.campaignId,
    });

    await this.webSocketProvider.sendMessage(
      userId,
      WebSocketEvent.CollectionMoved,
      {},
    );
  }
}
