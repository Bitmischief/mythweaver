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
import {
  Campaign,
  Character,
  Conjuration,
  ConjurationRelationshipType,
  Session,
} from '@prisma/client';
import { AppError, HttpCode } from '../lib/errors/AppError';
import {
  getRelationshipsFromDB,
  createRelationshipInDB,
  deleteRelationshipInDB,
  deleteRelationshipByNodeIdsInDB,
  updateRelationshipInDB,
  getRelationshipGraphFromDB,
} from '../dataAccess/relationships';

export interface RelationshipResponse {
  id: number;
  previousNodeId: number;
  previousType: ConjurationRelationshipType;
  nextNodeId: number;
  nextType: ConjurationRelationshipType;
  depth: number;
  visitedRelationships: number[];
  entityData: Session | Campaign | Character | Conjuration;
}

export interface PostRelationshipRequest {
  relatedNodeId: number;
  relatedNodeType: ConjurationRelationshipType;
  comment?: string;
  data?: any;
  twoWay: boolean;
}

export interface DeleteRelationshipRequest {
  previousNodeId: number;
  previousType: ConjurationRelationshipType;
  nextNodeId: number;
  nextType: ConjurationRelationshipType;
}

export interface PatchRelationshipRequest {
  comment?: string;
  data?: any;
}

export interface GraphLinkResponse {
  source: number;
  target: number;
  label: string;
}

@Route('relationships')
@Tags('Relationships')
export default class RelationshipController {
  @Security('jwt')
  @OperationId('getRelationships')
  @Get('/:type/:nodeId')
  public async getRelationships(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() type: ConjurationRelationshipType,
    @Route() nodeId: number,
    @Query() filterTypes?: ConjurationRelationshipType[],
    @Query() depthLimit?: number,
  ): Promise<RelationshipResponse[]> {
    logger.info('Fetching relationships for node', {
      userId,
      type,
      nodeId,
      filterTypes,
      depthLimit,
    });

    return getRelationshipsFromDB(userId, type, nodeId, filterTypes, depthLimit);
  }

  @Security('jwt')
  @OperationId('postRelationship')
  @Post('/:type/:nodeId')
  public async postRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() type: ConjurationRelationshipType,
    @Route() nodeId: number,
    @Body() body: PostRelationshipRequest,
  ) {
    logger.info('Creating relationship for node', {
      userId,
      type,
      nodeId,
      body,
    });

    await createRelationshipInDB(userId, type, nodeId, body);
  }

  @Security('jwt')
  @OperationId('deleteRelationship')
  @Delete('/:relationshipId')
  public async deleteRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() relationshipId: number,
  ) {
    await deleteRelationshipInDB(userId, relationshipId, logger);
  }

  @Security('jwt')
  @OperationId('deleteRelationshipByNodeIds')
  @Post('/remove')
  public async deleteRelationshipByNodeIds(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body() relationshipData: DeleteRelationshipRequest,
  ) {
    logger.info('Deleting relationship', {
      userId,
      relationshipData,
    });

    await deleteRelationshipByNodeIdsInDB(userId, relationshipData, logger);
  }

  @Security('jwt')
  @OperationId('patchRelationship')
  @Patch('/:relationshipId')
  public async patchRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() relationshipId: number,
    @Body() request: PatchRelationshipRequest,
  ) {
    await updateRelationshipInDB(userId, relationshipId, request, logger);
  }

  @Security('jwt')
  @OperationId('getRelationshipGraph')
  @Get('/graph')
  public async getRelationshipGraph(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() campaignId?: number,
  ): Promise<{
    nodes: Conjuration[];
    links: GraphLinkResponse[];
  }> {
    logger.info('Fetching relationship graph', {
      userId,
      campaignId,
    });

    return getRelationshipGraphFromDB(userId, campaignId, logger);
  }
}

