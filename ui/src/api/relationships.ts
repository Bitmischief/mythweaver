import axios from 'axios';
import { ConjurationRelationshipType } from '@/lib/enums.ts';

export interface PostRelationshipRequest {
  relatedNodeId: number;
  relatedNodeType: ConjurationRelationshipType;
  comment?: string;
  data?: any;
  twoWay?: boolean;
}

export interface DeleteRelationshipRequest {
  previousNodeId: number;
  previousType: ConjurationRelationshipType;
  nextNodeId: number;
  nextType: ConjurationRelationshipType;
}

export interface PatchConjurationRelationshipRequest {
  comment?: string;
  data?: any;
}

export const postConjurationRelationship = (
  conjurationId: number,
  type: ConjurationRelationshipType,
  request: PostRelationshipRequest,
) => {
  return axios.post(`/relationships/${type}/${conjurationId}`, request);
};

export const getConjurationRelationships = (
  nodeId: number,
  type: ConjurationRelationshipType,
  depthLimit = 1,
) => {
  return axios.get(`/relationships/${type}/${nodeId}`, {
    params: {
      depthLimit,
    },
  });
};

export const deleteConjurationRelationship = (relationshipId: number) => {
  return axios.delete(`/relationships/${relationshipId}`);
};

export const deleteConjurationRelationshipByNodeIds = (
  conjurationRelationship: DeleteRelationshipRequest,
) => {
  return axios.post(`/relationships/remove`, conjurationRelationship);
};

export const patchConjurationRelationship = (
  relationshipId: number,
  patchConjurationRelationshipRequest: PatchConjurationRelationshipRequest,
) => {
  return axios.patch(`/relationships/${relationshipId}`, patchConjurationRelationshipRequest);
};

export const getRelationshipGraph = (campaignId?: number) => {
  return axios.get(`/relationships/graph`, {
    params: {
      campaignId,
    },
  });
};
