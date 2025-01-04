import { Campaign } from '@prisma/client';

export interface GetCampaignsResponse {
  data: Campaign[];
  offset?: number;
  limit?: number;
}

export interface PostCampaignRequest {
  name: string;
  description?: string;
  rpgSystemCode?: string;
}

export interface PutCampaignRequest {
  name: string;
  description?: string;
}

export enum CampaignRole {
  DM = 1,
  Player = 2,
}

export interface InviteMemberRequest {
  email: string;
}
