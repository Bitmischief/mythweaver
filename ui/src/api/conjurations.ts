import axios from "axios";
import { useSelectedCampaignId } from "@/lib/hooks.ts";

export interface Conjuration {
  id: number;
  userId: number | undefined;
  conjurerCode: string;
  name: string;
  imageUri?: string;
  data: any;
  tags?: string[];
  copies?: Conjuration[];
}

export interface GetConjurationsRequest {
  campaignId?: number;
  mine?: boolean;
  conjurerCodes?: string[] | undefined;
  tags?: string[];
  offset: number;
  limit: number;
}

export const getConjurations = (request: GetConjurationsRequest) => {
  return axios.get("/conjurations", {
    params: {
      ...request,
      conjurerCodes: request.conjurerCodes?.join(","),
      tags: request.tags?.join(","),
    },
  });
};

export interface GetConjurationTagsRequest {
  term?: string;
  offset?: number;
  limit?: number;
}

export const getConjurationTags = (request: GetConjurationTagsRequest) => {
  return axios.get("/conjurations/tags", {
    params: request,
  });
};

export const addConjuration = (conjurationId: number) => {
  const selectedCampaignId = useSelectedCampaignId();

  return axios.post("/conjurations", {
    campaignId: selectedCampaignId.value,
    conjurationId,
  });
};

export const getConjuration = (conjurationId: number) => {
  return axios.get(`/conjurations/${conjurationId}`);
};

export interface PatchConjurationsRequest {
  tags?: string[];
  name?: string;
  imageUri?: string;
  data?: any;
}

export const patchConjuration = (conjurationId: number, request: PatchConjurationsRequest) => {
  return axios.patch(`/conjurations/${conjurationId}`, request);
};

export const deleteConjuration = (conjurationId: number) => {
  return axios.delete(`/conjurations/${conjurationId}`);
};
