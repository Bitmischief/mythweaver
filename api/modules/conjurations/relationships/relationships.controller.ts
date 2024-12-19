import { ConjurationsRelationshipsService } from '@/modules/conjurations/relationships/relationships.service';
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
import { Conjuration, ConjurationRelationshipType } from '@prisma/client';
import {
  RelationshipResponse,
  PostRelationshipRequest,
  DeleteRelationshipRequest,
  PatchRelationshipRequest,
  GraphLinkResponse,
} from '@/modules/conjurations/relationships/relationships.interface';

@Route('relationships')
@Tags('Relationships')
export class ConjurationsRelationshipsController {
  constructor(
    private conjurationsRelationshipsService: ConjurationsRelationshipsService,
  ) {}

  @Security('jwt')
  @OperationId('getRelationships')
  @Get('/:type/:nodeId')
  public async getRelationships(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() type: ConjurationRelationshipType,
    @Path() nodeId: number,
    @Query() filterTypes?: ConjurationRelationshipType[],
    @Query() depthLimit?: number,
  ): Promise<RelationshipResponse[]> {
    return this.conjurationsRelationshipsService.getRelationships(
      userId,
      trackingInfo,
      type,
      nodeId,
      filterTypes,
      depthLimit,
    );
  }

  @Security('jwt')
  @OperationId('postRelationship')
  @Post('/:type/:nodeId')
  public async postRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() type: ConjurationRelationshipType,
    @Path() nodeId: number,
    @Body() body: PostRelationshipRequest,
  ) {
    return this.conjurationsRelationshipsService.createRelationship(
      userId,
      trackingInfo,
      type,
      nodeId,
      body,
    );
  }

  @Security('jwt')
  @OperationId('deleteRelationship')
  @Delete('/:relationshipId')
  public async deleteRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() relationshipId: number,
  ) {
    await this.conjurationsRelationshipsService.deleteRelationship(
      userId,
      trackingInfo,
      relationshipId,
    );
  }

  @Security('jwt')
  @OperationId('deleteRelationshipByNodeIds')
  @Post('/remove')
  public async deleteRelationshipByNodeIds(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Body() relationshipData: DeleteRelationshipRequest,
  ) {
    await this.conjurationsRelationshipsService.deleteRelationshipsByNodeIds(
      userId,
      trackingInfo,
      relationshipData.previousNodeId,
      relationshipData.previousType,
      relationshipData.nextNodeId,
      relationshipData.nextType,
    );
  }

  @Security('jwt')
  @OperationId('patchRelationship')
  @Patch('/:relationshipId')
  public async patchRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Path() relationshipId: number,
    @Body() request: PatchRelationshipRequest,
  ) {
    await this.conjurationsRelationshipsService.updateRelationship(
      userId,
      trackingInfo,
      relationshipId,
      request,
    );
  }

  @Security('jwt')
  @OperationId('getRelationshipGraph')
  @Get('/graph')
  public async getRelationshipGraph(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Query() campaignId?: number,
  ): Promise<{
    nodes: Conjuration[];
    links: GraphLinkResponse[];
  }> {
    return await this.conjurationsRelationshipsService.getRelationshipGraph(
      userId,
      trackingInfo,
      campaignId,
    );
  }
}
