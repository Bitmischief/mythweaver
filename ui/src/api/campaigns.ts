import axios from 'axios';
import { Character } from '@/api/characters.ts';

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
  atmosphere?: string[];
  members?: CampaignMember[];
  inviteCode?: string;
  linked?: boolean;
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
    username: string;
  };
}

export interface GetCampaignRequest {
  term?: string;
  offset?: number;
  limit?: number;
  nodeId?: number;
  nodeType?: string;
}

export interface PostCampaignRequest {
  name: string;
  description?: string;
  imageUri?: string;
  rpgSystemCode: string;
}

export interface PutCampaignRequest {
  campaignId: number;
  name: string;
  description?: string;
  rpgSystemCode: string;
}

export interface CampaignInvite {
  invitingEmail: string;
  campaignName: string;
  members: [
    {
      email: string;
      username: string;
      role: number;
      character: Character[];
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

export const postCampaignConjuration = (campaignId: number, conjurationId: number) => {
  return axios.post(`campaigns/${campaignId}/conjurations/${conjurationId}`);
};

export const deleteCampaignConjuration = (campaignId: number, conjurationId: number) => {
  return axios.delete(`campaigns/${campaignId}/conjurations/${conjurationId}`);
};

export const getCampaignFiles = (campaignId: number) => {
  return axios.get(`/campaigns/${campaignId}/files`);
};
