import axios from 'axios';

export interface Conjuration {
  id: number;
  userId: number | undefined;
  conjurerCode: string;
  name: string;
  imageUri: string;
  data: any;
  tags?: string[];
  copies?: Conjuration[];
  originalId?: number;
  imageAIPrompt: string;
  saved: boolean;
  [key: string]: any;
}

export interface GetConjurationsRequest {
  campaignId?: number;
  mine?: boolean;
  saved?: boolean;
  conjurerCodes?: string[] | undefined;
  includesIdString?: string[] | undefined;
  imageStylePreset?: string;
  tags?: string[];
  offset: number;
  limit: number;
}

export const getConjurations = (request: GetConjurationsRequest) => {
  return axios.get('/conjurations', {
    params: {
      ...request,
      mine: request.mine === false ? undefined : request.mine,
      saved: request.saved === false ? undefined : request.saved,
      conjurerCodes: request.conjurerCodes?.join(','),
      includesIdString: request.includesIdString?.join(','),
      tags: request.tags?.join(','),
      stylePreset: request.imageStylePreset,
    },
  });
};

export interface getCollectionConjurationsRequest {
  collectionId?: number;
}

export const getCollectionConjurations = (request: getCollectionConjurationsRequest) => {
  return axios.get('/conjurations/collectionConjurations', {
    params: {
      ...request,
    },
  });
};

export interface GetConjurationTagsRequest {
  term?: string;
  offset?: number;
  limit?: number;
}

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

export const getConjuration = (conjurationId: number) => {
  return axios.get(`/conjurations/${conjurationId}`);
};

export interface PatchConjurationsRequest {
  tags?: string[];
  name?: string;
  imageUri?: string;
  data?: any;
}

export const patchConjuration = (conjurationId: number, request: PatchConjurationsRequest) => {
  return axios.patch(`/conjurations/${conjurationId}`, request);
};

export interface CreateCollectionConjurationRequest {
  conjurationId?: number;
  collectionId?: number;
}
export interface UpdateCollectionConjurationRequest {
  id: number;
  conjurationId?: number;
  collectionId?: number;
}
export const createCollectionConjuration = (request: CreateCollectionConjurationRequest) => {
  return axios.post('/conjurations/createCollectionConjuration', request);
};
export const updateCollectionConjuration = (request: UpdateCollectionConjurationRequest) => {
  return axios.post('/conjurations/updateCollectionConjuration', request);
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
