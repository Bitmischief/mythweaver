import axios from "axios";
import { RpgSystem } from "@/api/rpgSystems.ts";

export interface Campaign {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  imageUri: string;
  rpgSystemId: number;
  rpgSystem: RpgSystem;
  publicAdventureId: number | null | undefined;
  publicAdventure: PublicAdventure;
}
export interface PublicAdventure {
  id: number;
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
  description: string;
  imageUri?: string;
  rpgSystemId: number;
  publicAdventureId: number | null | undefined;
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
