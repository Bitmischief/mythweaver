import {
  Body,
  Get,
  Inject,
  OperationId,
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
import { z } from 'zod';

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
    @Query() offset?: number,
    @Query() limit?: number,
  ): Promise<RelationshipResponse[]> {
    logger.info('Fetching relationships for node', {
      userId,
      type,
      nodeId,
      filterTypes,
      depthLimit,
    });

    // return prisma.$queryRaw`SELECT 'hello ' || ${type} || ${nodeId}`;
    return prisma.$queryRawUnsafe(`
        WITH RECURSIVE entity_chain AS (
          SELECT
            cr.*,
            ARRAY[cr.id] AS visitedRelationships,
            1 depth
          FROM
            conjuration_relationships cr
          WHERE
            cr."previousNodeId" = ${nodeId} AND cr."previousType" = '${type}'
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
            NOT ecr.id = ANY(ec.visitedRelationships) AND depth < 3
        ), enriched_entities AS (
          SELECT DISTINCT ON (ec.id)
            ec.*,
          CASE
            WHEN ec."nextType" = 'CONJURATION' THEN to_jsonb(conj.*)
            WHEN ec."nextType" = 'SESSION' THEN to_jsonb(sess.*)
            WHEN ec."nextType" = 'CAMPAIGN' THEN to_jsonb(camp.*)
            WHEN ec."nextType" = 'CHARACTER' THEN to_jsonb(character.*)
          END AS entityData
          FROM
            entity_chain ec
          LEFT JOIN
            conjurations conj ON ec."nextType" = 'CONJURATION' AND ec."nextNodeId" = conj.id
          LEFT JOIN
            sessions sess ON ec."nextType" = 'SESSION' AND ec."nextNodeId" = sess.id
          LEFT JOIN
            campaigns camp ON ec."nextType" = 'CAMPAIGN' AND ec."nextNodeId" = camp.id
          LEFT JOIN
            characters character ON ec."nextType" = 'CHARACTER' AND ec."nextNodeId" = character.id
          ORDER BY ec.id, ec.depth
        )
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

    await prisma.conjurationRelationships.create({
      data: {
        previousNodeId: nodeId,
        previousType: type,
        nextNodeId: body.relatedNodeId,
        nextType: body.relatedNodeType,
        comment: body.comment,
        data: body.data,
      },
    });
  }
}
