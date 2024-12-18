import { prisma } from '@/lib/providers/prisma';
import { Conjuration, ConjurationRelationshipType } from '@prisma/client';
import { ConjurationRelationships } from '@prisma/client';
import {
  GraphLinkResponse,
  RelationshipResponse,
} from '@/modules/conjurations/relationships/relationships.interface';

export class ConjurationsRelationshipsDataProvider {
  async getRelationships(
    nodeId: number,
    userId: number,
  ): Promise<RelationshipResponse[]> {
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

  async createRelationship(data: any): Promise<void> {
    await prisma.conjurationRelationships.create({
      data: data,
    });
  }

  async getRelationshipCount(
    userId: number,
    previousNodeId: number,
    previousType: ConjurationRelationshipType,
    nextNodeId: number,
    nextType: ConjurationRelationshipType,
  ): Promise<number> {
    return prisma.conjurationRelationships.count({
      where: {
        previousNodeId: previousNodeId,
        previousType: previousType,
        nextNodeId: nextNodeId,
        nextType: nextType,
        userId: userId,
      },
    });
  }

  async findUserRelationship(
    relationshipId: number,
    userId: number,
  ): Promise<ConjurationRelationships | null> {
    return prisma.conjurationRelationships.findUnique({
      where: {
        id: relationshipId,
        userId: userId,
      },
    });
  }

  async findManyConjurationRelationships(
    userId: number,
    previousNodeId: number,
    previousType?: ConjurationRelationshipType,
    nextNodeIds?: number[],
  ): Promise<ConjurationRelationships[]> {
    return await prisma.conjurationRelationships.findMany({
      where: {
        previousNodeId: previousNodeId,
        previousType: previousType,
        userId: userId,
        nextNodeId: {
          in: nextNodeIds,
        },
        OR: [
          {
            nextType: ConjurationRelationshipType.CONJURATION,
          },
        ],
      },
    });
  }

  async findManyConjurationRelationshipsByConjurationIds(
    userId: number,
    nodeId: number,
    nodeType?: ConjurationRelationshipType,
    conjurationIds?: number[],
  ): Promise<any[]> {
    return prisma.conjurationRelationships.findMany({
      where: {
        previousNodeId: nodeId,
        previousType: nodeType,
        userId: userId,
        nextNodeId: conjurationIds ? { in: conjurationIds } : undefined,
      },
    });
  }

  async getRelationshipGraphNodes(
    userId: number,
    conjurationIds: number[],
    campaignId?: number,
  ): Promise<Conjuration[]> {
    return (await prisma.$queryRawUnsafe(`
            SELECT DISTINCT ON (conj.id) conj.*
            FROM conjuration_relationships cr
                INNER JOIN (
                    SELECT c.*, i.uri as "imageUri"
                    FROM conjurations c
                        LEFT JOIN (
                            SELECT *
                            FROM images
                            WHERE "primary" = true
                        ) i ON i."conjurationId" = c.id
                    ${campaignId ? `WHERE c.id IN (${conjurationIds.join(',')})` : ''}
                ) as conj ON cr."previousNodeId" = conj.id OR cr."nextNodeId" = conj.id
            WHERE cr."previousType" = 'CONJURATION' AND cr."nextType" = 'CONJURATION' AND cr."userId" = ${userId}
          `)) as Conjuration[];
  }

  async getRelationshipGraphLinks(
    userId: number,
    conjurationIds: number[],
    campaignId?: number,
  ): Promise<GraphLinkResponse[]> {
    return (await prisma.$queryRawUnsafe(`
            SELECT cr."previousNodeId" as source, cr."nextNodeId" as target, cr.comment as label
            FROM conjuration_relationships cr
            WHERE cr."previousType" = 'CONJURATION' AND 
                  cr."nextType" = 'CONJURATION' AND
                  cr."userId" = ${userId} 
                  ${
                    campaignId
                      ? `AND cr."previousNodeId" IN (${conjurationIds.join(',')}) AND cr."nextNodeId" IN (${conjurationIds.join(',')})`
                      : ''
                  }
          `)) as GraphLinkResponse[];
  }

  async updateRelationship(relationshipId: number, data: any): Promise<void> {
    await prisma.conjurationRelationships.update({
      where: {
        id: relationshipId,
      },
      data: data,
    });
  }

  async deleteRelationship(relationshipId: number): Promise<void> {
    await prisma.conjurationRelationships.delete({
      where: {
        id: relationshipId,
      },
    });
  }

  async deleteRelationshipsByNodeIds(
    previousNodeId: number,
    previousType: ConjurationRelationshipType,
    nextNodeId: number,
    nextType: ConjurationRelationshipType,
  ): Promise<void> {
    await prisma.conjurationRelationships.deleteMany({
      where: {
        previousNodeId: previousNodeId,
        previousType: previousType,
        nextNodeId: nextNodeId,
        nextType: nextType,
      },
    });
  }

  async deleteConjurationRelationships(conjurationId: number): Promise<void> {
    await prisma.conjurationRelationships.deleteMany({
      where: {
        OR: [
          {
            nextNodeId: conjurationId,
          },
          {
            previousNodeId: conjurationId,
          },
        ],
      },
    });
  }
}
