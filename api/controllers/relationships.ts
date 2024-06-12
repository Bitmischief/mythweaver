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
        WITH RECURSIVE entity_chain AS (
          SELECT
            cr.*,
            ARRAY[cr.id] AS visitedRelationships,
            1 depth
          FROM
            conjuration_relationships cr
          WHERE
            cr."previousNodeId" = ${nodeId} AND cr."previousType" = '${type}' AND cr."userId" = '${userId}'
          UNION ALL
          SELECT
            ecr.*,
            ec.visitedRelationships || ecr.id,
            depth + 1 AS depth
          FROM
            conjuration_relationships ecr
          JOIN
            entity_chain ec ON ec."nextNodeId" = ecr."previousNodeId" AND ec."nextType" = ecr."previousType"
          WHERE
            NOT ecr.id = ANY(ec.visitedRelationships) AND depth < ${depthLimit}
        ), enriched_entities AS (
          SELECT DISTINCT ON (ec.id)
            ec.*,
          CASE
            WHEN ec."nextType" = 'CONJURATION' THEN to_jsonb(conj.*)
            WHEN ec."nextType" = 'SESSION' THEN to_jsonb(sess.*)
            WHEN ec."nextType" = 'CAMPAIGN' THEN to_jsonb(camp.*)
          END AS entityData
          FROM entity_chain ec
           LEFT JOIN
               (SELECT c.*, i.uri as "imageUri"
                FROM conjurations c
                    LEFT JOIN (SELECT *
                               FROM images
                               WHERE "primary" = true) i
                    ON i."conjurationId" = c.id) conj
               ON (ec."nextType" = 'CONJURATION' OR ec."nextType" = 'CHARACTER') AND ec."nextNodeId" = conj.id
           LEFT JOIN
               (SELECT s.*, i.uri as "imageUri"
                FROM sessions s
                    LEFT JOIN (SELECT *
                               FROM images
                               WHERE "primary" = true) i
                    ON i."sessionId" = s.id) sess
               ON ec."nextType" = 'SESSION' AND ec."nextNodeId" = sess.id
           LEFT JOIN
               campaigns camp ON ec."nextType" = 'CAMPAIGN' AND ec."nextNodeId" = camp.id
          ORDER BY ec.id, ec.depth)
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

  @Security('jwt')
  @OperationId('deleteRelationship')
  @Delete('/:relationshipId')
  public async deleteRelationship(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Route() relationshipId: number,
  ) {
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
    logger.info('Deleting relationship', {
      relationshipId,
      userId,
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
}
