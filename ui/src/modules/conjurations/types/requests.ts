import { ConjurationRelationshipType } from '@/lib/enums';

export interface GetConjurationsRequest {
  campaignId?: number;
  mine?: boolean;
  saved?: boolean;
  conjurerCodes?: string[] | undefined;
  imageStylePreset?: string;
  tags?: string[];
  offset: number;
  limit: number;
  search?: string;
  nodeId?: number;
  nodeType?: ConjurationRelationshipType;
  collectionId?: number;
}

export interface GetConjurationTagsRequest {
  term?: string;
  offset?: number;
  limit?: number;
}

export interface PatchConjurationsRequest {
  tags?: string[];
  name?: string;
  imageUri?: string;
  data?: any;
}

export interface PostConvertConjurationRequest {
  conjurationId: number;
  conjurerCode: string;
}
