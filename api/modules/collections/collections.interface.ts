export interface PostCollectionRequest {
  name: string;
  parentId: number | null;
  campaignId: number | null;
}

export interface PatchCollectionRequest {
  name: string;
}

export interface PostCollectionConjurationRequest {
  conjurationId: number;
}

export interface PostMoveCollectionConjurationRequest {
  collectionId: number;
}

export interface PostMoveCollectionRequest {
  parentCollectionId: number;
}
