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
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';

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

    return prisma.$queryRawUnsafe(`
        WITH entity_chain AS (
          SELECT cr.*,
            ARRAY[cr.id] AS visitedRelationships,
            1 depth
          FROM
            conjuration_relationships cr
          WHERE
            cr."previousNodeId" = ${nodeId} AND cr."previousType" = 'CONJURATION' AND cr."nextType" = 'CONJURATION' AND cr."userId" = ${userId}
        ), enriched_entities AS (
          SELECT ec.*, to_jsonb(conj.*) || jsonb_build_object('imageUri', i.uri) AS entityData
            FROM conjurations conj
                LEFT JOIN (SELECT *
                           FROM images
                           WHERE "primary" = true) i
                ON i."conjurationId" = conj.id
            INNER JOIN entity_chain ec ON ec."nextNodeId" = conj.id
          ORDER BY ec."updatedAt" DESC)
        SELECT * FROM enriched_entities;
      `);
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

    const existingCount = await prisma.conjurationRelationships.count({
      where: {
        previousNodeId: nodeId,
        previousType: type,
        nextNodeId: body.relatedNodeId,
        nextType: body.relatedNodeType,
        userId: userId,
      },
    });

    if (existingCount === 0) {
      await prisma.conjurationRelationships.create({
        data: {
          previousNodeId: nodeId,
          previousType: type,
          nextNodeId: body.relatedNodeId,
          nextType: body.relatedNodeType,
          comment: body.comment,
          data: body.data,
          userId: userId,
        },
      });
    }

    if (body.twoWay) {
      const reverseCount = await prisma.conjurationRelationships.count({
        where: {
          previousNodeId: body.relatedNodeId,
          previousType: body.relatedNodeType,
          nextNodeId: nodeId,
          nextType: type,
          userId: userId,
        },
      });
      if (reverseCount === 0) {
        await prisma.conjurationRelationships.create({
          data: {
            previousNodeId: body.relatedNodeId,
            previousType: body.relatedNodeType,
            nextNodeId: nodeId,
            nextType: type,
            comment: body.comment,
            data: body.data,
            userId: userId,
          },
        });
      }
    }
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
    const relationship = await prisma.conjurationRelationships.findUnique({
      where: {
        id: relationshipId,
        userId: userId,
      },
    });

    if (!relationship) {
      throw new AppError({
        description: 'Relationship not found or you do not have access to it.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    logger.info('Deleting relationship', {
      userId,
    });

    await prisma.conjurationRelationships.delete({
      where: {
        id: relationshipId,
      },
    });
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

    await prisma.conjurationRelationships.deleteMany({
      where: {
        previousNodeId: relationshipData.previousNodeId,
        previousType: relationshipData.previousType,
        nextNodeId: relationshipData.nextNodeId,
        nextType: relationshipData.nextType,
      },
    });
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
    const relationship = await prisma.conjurationRelationships.findUnique({
      where: {
        id: relationshipId,
        userId: userId,
      },
    });

    if (!relationship) {
      throw new AppError({
        description: 'Relationship not found or you do not have access to it.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    logger.info('Updating relationship', {
      relationshipId,
      userId,
      request,
    });

    await prisma.conjurationRelationships.update({
      where: {
        id: relationshipId,
      },
      data: {
        ...request,
      },
    });
  }

  @Security('jwt')
  @OperationId('getRelationshipGraph')
  @Get('/graph')
  public async getRelationshipGraph(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Query() depthLimit?: number,
  ): Promise<{
    nodes: Conjuration[];
    links: GraphLinkResponse[];
  }> {
    logger.info('Fetching relationship graph', {
      userId,
      depthLimit,
    });

    const nodes = (await prisma.$queryRawUnsafe(`
        SELECT DISTINCT ON (conj.id) conj.*
        FROM conjuration_relationships cr
            LEFT JOIN (
                SELECT c.*, i.uri as "imageUri"
                FROM conjurations c
                    LEFT JOIN (
                        SELECT *
                        FROM images
                        WHERE "primary" = true
                    ) i ON i."conjurationId" = c.id
            ) as conj ON cr."previousNodeId" = conj.id OR cr."nextNodeId" = conj.id
        WHERE cr."previousType" = 'CONJURATION' AND cr."nextType" = 'CONJURATION' AND cr."userId" = ${userId}
      `)) as Conjuration[];

    const links = (await prisma.$queryRawUnsafe(`
        SELECT cr."previousNodeId" as source, cr."nextNodeId" as target, cr.comment as label
        FROM conjuration_relationships cr
        WHERE cr."previousType" = 'CONJURATION' AND cr."nextType" = 'CONJURATION' AND cr."userId" = ${userId}
      `)) as GraphLinkResponse[];

    return {
      nodes: nodes,
      links: links,
    };
  }
}
