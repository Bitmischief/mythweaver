import axios from 'axios';
import { ConjurationRelationshipType } from '@/lib/enums.ts';

export interface PostRelationshipRequest {
  relatedNodeId: number;
  relatedNodeType: ConjurationRelationshipType;
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

export const getConjurationRelationships = (nodeId: number, type: ConjurationRelationshipType) => {
  return axios.get(`/relationships/${type}/${nodeId}`);
};

export const deleteConjurationRelationship = (relationshipId: number) => {
  return axios.delete(`/relationships/${relationshipId}`);
};
