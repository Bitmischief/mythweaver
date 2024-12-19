import { CollectionsService } from '@/modules/collections/collections.service';
import {
  Body,
  Delete,
  Get,
  Inject,
  OperationId,
  Patch,
  Post,
  Query,
  Path,
  Security,
  Tags,
  Route,
} from 'tsoa';
import { TrackingInfo } from '@/modules/core/analytics/tracking';
import {
  PostCollectionRequest,
  PatchCollectionRequest,
  PostCollectionConjurationRequest,
  PostMoveCollectionConjurationRequest,
  PostMoveCollectionRequest,
} from '@/modules/collections/collections.interface';

@Route('collections')
@Tags('Collections')
export class CollectionsController {
  constructor(private collectionsService: CollectionsService) {}

  @Security('jwt')
  @OperationId('getCollections')
  @Get('/')
  public async getCollections(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() parentId?: number,
    @Query() campaignId?: number,
    @Query() conjurationId?: number,
  ) {
    return await this.collectionsService.getCollections(
      userId,
      trackingInfo,
      parentId,
      campaignId,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('postCollection')
  @Post('/')
  public async postCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() collection: PostCollectionRequest,
  ) {
    return await this.collectionsService.createCollection(
      userId,
      trackingInfo,
      collection,
    );
  }

  @Security('jwt')
  @OperationId('deleteCollection')
  @Delete('/:collectionId')
  public async deleteCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() collectionId: number,
  ) {
    return await this.collectionsService.deleteCollection(
      userId,
      trackingInfo,
      collectionId,
    );
  }

  @Security('jwt')
  @OperationId('deleteCollectionConjuration')
  @Delete('/:collectionId/conjuration/:conjurationId')
  public async deleteCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() collectionId: number,
    @Path() conjurationId: number,
  ) {
    return await this.collectionsService.deleteCollectionConjuration(
      userId,
      trackingInfo,
      collectionId,
      conjurationId,
    );
  }

  @Security('jwt')
  @OperationId('patchCollection')
  @Patch('/:collectionId')
  public async patchCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() collectionId: number,
    @Body() patchCollectionRequest: PatchCollectionRequest,
  ) {
    return await this.collectionsService.updateCollection(
      userId,
      trackingInfo,
      collectionId,
      patchCollectionRequest,
    );
  }

  @Security('jwt')
  @OperationId('postCollectionConjuration')
  @Post('/:collectionId/conjurations')
  public async postCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() collectionId: number,
    @Body() collectionConjurationRequest: PostCollectionConjurationRequest,
  ) {
    return await this.collectionsService.createCollectionConjuration(
      userId,
      trackingInfo,
      collectionId,
      collectionConjurationRequest,
    );
  }

  @Security('jwt')
  @OperationId('postMoveCollectionConjuration')
  @Post('/:collectionId/conjurations/:conjurationId/move')
  public async postMoveCollectionConjuration(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() collectionId: number,
    @Path() conjurationId: number,
    @Body()
    postMoveCollectionConjurationRequest: PostMoveCollectionConjurationRequest,
  ) {
    return await this.collectionsService.moveCollectionConjuration(
      userId,
      trackingInfo,
      collectionId,
      conjurationId,
      postMoveCollectionConjurationRequest,
    );
  }

  @Security('jwt')
  @OperationId('postMoveCollection')
  @Post('/:collectionId/move')
  public async postMoveCollection(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() collectionId: number,
    @Body() postMoveCollectionRequest: PostMoveCollectionRequest,
  ) {
    return await this.collectionsService.moveCollection(
      userId,
      trackingInfo,
      collectionId,
      postMoveCollectionRequest,
    );
  }
}
