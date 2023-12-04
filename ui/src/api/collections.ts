import axios from 'axios';

export interface Collection {
  id: number;
  userId: number | undefined;
  name: string;
  description: string;
  saved: boolean;
}

export interface getCollectionsRequest {
  campaignId?: number;
  mine?: boolean;
  saved?: boolean;
  offset: number;
  limit: number;
}

export const getCollections = (request: getCollectionsRequest) => {
  return axios.get('/collections', {
    params: {
      ...request,
      mine: request.mine === false ? undefined : request.mine,
      saved: request.saved === false ? undefined : request.saved,
    },
  });
};
export const saveCollection = (collectionId: number) => {
  return axios.post(`/collections/${collectionId}/save`, {
    collectionId,
  });
};

export const getCollection = (collectionId: number) => {
  return axios.get(`/collections/${collectionId}`);
};

export interface PatchCollectionsRequest {
  name?: string;
  description?: string;
}

export const patchCollections = (collectionId: number, request: PatchCollectionsRequest) => {
  return axios.patch(`/collections/${collectionId}`, request);
};

export const deleteCollection = (collectionId: number) => {
  return axios.delete(`/collections/${collectionId}`);
};

export const removeCollection = (collectionId: number) => {
  return axios.post(`/collections/${collectionId}/remove`);
};

export const copyCollection = (collectionId: number) => {
  return axios.post(`/collections/${collectionId}/copy`);
};
