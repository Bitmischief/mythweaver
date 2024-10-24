import { Conjuration, ConjurationVisibility } from '@prisma/client';

export interface GetConjurationsResponse {
  data: (Conjuration & { saved: boolean })[];
  offset?: number;
  limit?: number;
}

export interface GetConjurationTagsResponse {
  data: string[];
  offset?: number;
  limit?: number;
}

export interface PatchConjurationRequest {
  campaignId: number;
  name: string;
  imageUri?: string;
  data: any;
  tags?: string[];
  visibility?: ConjurationVisibility;
}

export interface ConvertConjurationRequest {
  conjurationId: number;
  conjurerCode: string;
}
