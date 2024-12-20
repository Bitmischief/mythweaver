import { ConjurationsRelationshipsDataProvider } from '@/modules/conjurations/relationships/relationships.dataprovider';
import { CollectionsDataProvider } from '@/modules/collections/collections.dataprovider';
import {
  PatchRelationshipRequest,
  GraphLinkResponse,
  PostRelationshipRequest,
  RelationshipResponse,
} from '@/modules/conjurations/relationships/relationships.interface';
import { TrackingInfo } from '@/modules/core/analytics/tracking';
import { Conjuration, ConjurationRelationshipType } from '@prisma/client';
import { Logger } from '@/modules/core/logging/logger';
import { AppError, HttpCode } from '@/modules/core/errors/AppError';

export class ConjurationsRelationshipsService {
  constructor(
    private relationshipsDataProvider: ConjurationsRelationshipsDataProvider,
    private collectionsDataProvider: CollectionsDataProvider,
    private logger: Logger,
  ) {}

  async getRelationships(
    userId: number,
    trackingInfo: TrackingInfo,
    type: ConjurationRelationshipType,
    nodeId: number,
    filterTypes?: ConjurationRelationshipType[],
    depthLimit?: number,
  ): Promise<RelationshipResponse[]> {
    this.logger.info('Fetching relationships for node', {
      userId,
      type,
      nodeId,
      filterTypes,
      depthLimit,
    });

    return await this.relationshipsDataProvider.getRelationships(
      nodeId,
      userId,
    );
  }

  async createRelationship(
    userId: number,
    trackingInfo: TrackingInfo,
    type: ConjurationRelationshipType,
    nodeId: number,
    data: PostRelationshipRequest,
  ): Promise<void> {
    this.logger.info('Creating relationship for node', {
      userId,
      type,
      nodeId,
      data,
    });

    const existingCount =
      await this.relationshipsDataProvider.getRelationshipCount(
        userId,
        nodeId,
        type,
        data.relatedNodeId,
        data.relatedNodeType,
      );

    if (existingCount === 0) {
      await await this.relationshipsDataProvider.createRelationship({
        previousNodeId: nodeId,
        previousType: type,
        nextNodeId: data.relatedNodeId,
        nextType: data.relatedNodeType,
        comment: data.comment,
        data: data.data,
        userId: userId,
      });
    }

    if (data.twoWay) {
      const reverseCount =
        await this.relationshipsDataProvider.getRelationshipCount(
          userId,
          data.relatedNodeId,
          data.relatedNodeType,
          nodeId,
          type,
        );

      if (reverseCount === 0) {
        await this.relationshipsDataProvider.createRelationship({
          previousNodeId: data.relatedNodeId,
          previousType: data.relatedNodeType,
          nextNodeId: nodeId,
          nextType: type,
          comment: data.comment,
          data: data.data,
          userId: userId,
        });
      }
    }
  }

  async deleteRelationship(
    userId: number,
    trackingInfo: TrackingInfo,
    relationshipId: number,
  ): Promise<void> {
    const relationship =
      await this.relationshipsDataProvider.findUserRelationship(
        relationshipId,
        userId,
      );

    if (!relationship) {
      throw new AppError({
        description: 'Relationship not found or you do not have access to it.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    this.logger.info('Deleting relationship', {
      userId,
    });

    await this.relationshipsDataProvider.deleteRelationship(relationshipId);
  }

  async deleteRelationshipsByNodeIds(
    userId: number,
    trackingInfo: TrackingInfo,
    previousNodeId: number,
    previousType: ConjurationRelationshipType,
    nextNodeId: number,
    nextType: ConjurationRelationshipType,
  ): Promise<void> {
    this.logger.info('Deleting relationships by node ids', {
      userId,
      relationshipData: {
        previousNodeId,
        previousType,
        nextNodeId,
        nextType,
      },
    });

    await this.relationshipsDataProvider.deleteRelationshipsByNodeIds(
      previousNodeId,
      previousType,
      nextNodeId,
      nextType,
    );
  }

  async updateRelationship(
    userId: number,
    trackingInfo: TrackingInfo,
    relationshipId: number,
    request: PatchRelationshipRequest,
  ): Promise<void> {
    const relationship =
      await this.relationshipsDataProvider.findUserRelationship(
        relationshipId,
        userId,
      );

    if (!relationship) {
      throw new AppError({
        description: 'Relationship not found or you do not have access to it.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }

    this.logger.info('Updating relationship', {
      relationshipId,
      userId,
      request,
    });

    await this.relationshipsDataProvider.updateRelationship(
      relationshipId,
      request,
    );
  }

  async getRelationshipGraph(
    userId: number,
    trackingInfo: TrackingInfo,
    campaignId?: number,
  ): Promise<{
    nodes: Conjuration[];
    links: GraphLinkResponse[];
  }> {
    this.logger.info('Fetching relationship graph', {
      userId,
      campaignId,
    });

    let conjurationIds: any[] = [];
    if (campaignId) {
      conjurationIds =
        await this.collectionsDataProvider.getCollectionConjurationIdsByCampaignId(
          campaignId,
        );
    }

    let nodes: Conjuration[] = [];
    let links: GraphLinkResponse[] = [];

    if (!campaignId || (campaignId && conjurationIds.length)) {
      nodes = await this.relationshipsDataProvider.getRelationshipGraphNodes(
        userId,
        conjurationIds,
        campaignId,
      );
      links = await this.relationshipsDataProvider.getRelationshipGraphLinks(
        userId,
        conjurationIds,
        campaignId,
      );
    }

    return {
      nodes: nodes,
      links: links,
    };
  }
}
