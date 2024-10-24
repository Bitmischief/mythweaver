import {
  Campaign,
  Character,
  Conjuration,
  ConjurationRelationshipType,
  Session,
} from '@prisma/client';

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
