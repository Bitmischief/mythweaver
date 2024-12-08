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
