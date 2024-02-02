import axios from 'axios';
import { RpgSystem } from '@/api/rpgSystems.ts';

export const enum CampaignRole {
  DM = 1,
  Player = 2,
}

export interface Campaign {
  id?: number;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  imageUri?: string;
  rpgSystemCode: string;
  rpgSystem?: RpgSystem;
  publicAdventureCode: string | null | undefined;
  publicAdventure?: PublicAdventure;
  atmosphere?: string[];
  members?: CampaignMember[];
}

export interface CampaignMember {
  id: number;
  email: string;
  role: number;
  createdAt: string;
  updatedAt: string;
  joinedAt: string;
  user: {
    id: number;
    email: string;
  };
}

export interface PublicAdventure {
  code: string;
  name: string;
  description: string;
  imageUri: string;
  tags: string[];
  releaseDate: Date;
  rpgSystemId: number;
  relevance: number;
}

export interface GetCampaignRequest {
  term?: string;
  offset?: number;
  limit?: number;
}

export interface PostCampaignRequest {
  name: string;
  description?: string;
  imageUri?: string;
  rpgSystemCode: string;
  publicAdventureCode: string | null | undefined;
}

export interface PutCampaignRequest {
  campaignId: number;
  name: string;
  description?: string;
  imageUri?: string;
  rpgSystemCode: string;
  publicAdventureCode: string | null | undefined;
}

export interface CampaignInvite {
  invitingEmail: string;
  campaignName: string;
  members: [
    {
      characterName: string;
      characterImageUri: string;
    },
  ];
}

export const getCampaigns = (query: GetCampaignRequest) => {
  return axios.get('/campaigns', {
    params: query,
  });
};

export const getCampaign = (campaignId: number) => {
  return axios.get(`/campaigns/${campaignId}`);
};

export const createCampaign = (request: PostCampaignRequest) => {
  return axios.post('/campaigns', request);
};

export const saveCampaign = (request: PutCampaignRequest) => {
  return axios.put(`/campaigns/${request.campaignId}`, {
    ...request,
    campaignId: undefined,
  });
};

export const deleteCampaign = (campaignId: number) => {
  return axios.delete(`/campaigns/${campaignId}`);
};

export const invitePlayerToCampaign = (email: string, campaignId: number) => {
  return axios.post(`/campaigns/${campaignId}/members`, {
    email,
  });
};

export const deleteCampaignMember = (campaignId: number, memberId: number) => {
  return axios.delete(`/campaigns/${campaignId}/members/${memberId}`);
};

export const getCampaignInvite = (inviteCode: string) => {
  return axios.get(`/campaigns/invites/${inviteCode}`);
};

export const acceptCampaignInvite = (inviteCode: string) => {
  return axios.post(`/campaigns/invites/${inviteCode}`);
};

export const getCampaignCharacters = (campaignId: number) => {
  return axios.get(`campaigns/${campaignId}/characters`);
};
