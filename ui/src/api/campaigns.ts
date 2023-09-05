import axios from "axios";
import { RpgSystem } from "@/api/rpgSystems.ts";

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

export const getCampaigns = (query: GetCampaignRequest) => {
  return axios.get("/campaigns", {
    params: query,
  });
};

export const getCampaign = (campaignId: number) => {
  return axios.get(`/campaigns/${campaignId}`);
};

export const createCampaign = (request: PostCampaignRequest) => {
  return axios.post("/campaigns", request);
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
