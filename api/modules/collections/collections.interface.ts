export interface PostCollectionRequest {
  name: string;
  parentId: number;
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
