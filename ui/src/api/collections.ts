import axios from 'axios';

export interface PostCollectionSchema {
  name: string;
  parentId?: number;
}

export interface PatchCollectionSchema {
  name: string;
}

export interface PostCollectionConjurationSchema {
  conjurationId: number;
}

export interface PostMoveCollectionConjurationSchema {
  collectionId: number;
  conjurationId: number;
}

export interface PostMoveCollectionSchema {
  parentCollectionId: number;
}

export const getCollections = (parentId?: number) => {
  return axios.get(`/collections`, {
    params: {
      parentId,
    },
  });
};

export const saveCollection = (collection: PostCollectionSchema) => {
  return axios.post(`/collections`, collection);
};

export const saveCollectionConjuration = (
  collectionId: number,
  collectionConjuration: PostCollectionConjurationSchema,
) => {
  return axios.post(`/collections/${collectionId}/conjurations`, collectionConjuration);
};

export const patchCollection = (collectionId: number, collection: PatchCollectionSchema) => {
  return axios.patch(`/collections/${collectionId}`, collection);
};

export const postMoveCollectionConjuration = (
  collectionConjuration: PostMoveCollectionConjurationSchema,
) => {
  return axios.post(`/collections/conjurations/move`, collectionConjuration);
};

export const postMoveCollection = (
  collectionId: number,
  moveCollection: PostMoveCollectionSchema,
) => {
  return axios.post(`/collections/${collectionId}/move`, moveCollection);
};
