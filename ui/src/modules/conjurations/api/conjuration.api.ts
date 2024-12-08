import axios from 'axios';
import {
  GetConjurationsRequest,
  GetConjurationTagsRequest,
  PatchConjurationsRequest,
  PostConvertConjurationRequest,
} from '../types';

export const getConjuration = (conjurationId: number) => {
  return axios.get(`/conjurations/${conjurationId}`);
};

export const getConjurations = (request: GetConjurationsRequest) => {
  return axios.get('/conjurations', {
    params: {
      ...request,
      mine: request.mine === false ? undefined : request.mine,
      saved: request.saved === false ? undefined : request.saved,
      conjurerCodes: request.conjurerCodes?.join(','),
      tags: request.tags?.join(','),
      stylePreset: request.imageStylePreset,
      nodeId: request.nodeId,
      nodeType: request.nodeType,
      collectionId: request.collectionId,
    },
  });
};

export const getConjurationTags = (request: GetConjurationTagsRequest) => {
  return axios.get('/conjurations/tags', {
    params: request,
  });
};

export const saveConjuration = (conjurationId: number) => {
  return axios.post(`/conjurations/${conjurationId}/save`, {
    conjurationId,
  });
};

export const patchConjuration = (conjurationId: number, request: PatchConjurationsRequest) => {
  return axios.patch(`/conjurations/${conjurationId}`, request);
};

export const deleteConjuration = (conjurationId: number) => {
  return axios.delete(`/conjurations/${conjurationId}`);
};

export const removeConjuration = (conjurationId: number) => {
  return axios.post(`/conjurations/${conjurationId}/remove`);
};

export const copyConjuration = (conjurationId: number) => {
  return axios.post(`/conjurations/${conjurationId}/copy`);
};

export const getConjurationRequest = (requestId: number) => {
  return axios.get(`/conjurations/request/${requestId}`);
};

export const postConvertConjurationRequest = (request: PostConvertConjurationRequest) => {
  return axios.post(`/conjurations/convert`, request);
};
