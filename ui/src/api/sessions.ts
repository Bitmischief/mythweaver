import axios from "axios";
import { useSelectedCampaignId } from "@/lib/hooks.ts";

export interface SessionBase {
  id: number;
  when: string;
  summary?: string | undefined;
  transcript?: string | undefined;
  description?: string | undefined;
  campaignId: number;
}

export interface GetSessionsRequest {
  offset?: number;
  limit?: number;
}

export interface PostSessionRequest {
  id: number;
  when: Date;
  summary?: string | undefined;
  transcript?: string | undefined;
  description?: string | undefined;
  campaignId: number;
}

export interface PatchSessionRequest {
  id: number;
  when: Date;
  summary?: string | undefined;
  transcript?: string | undefined;
  description?: string | undefined;
  campaignId: number;
}

export const getSessions = (query: GetSessionsRequest) => {
  const selectedCampaignId = useSelectedCampaignId();

  return axios.get("/sessions", {
    params: {
      ...query,
      campaignId: selectedCampaignId.value,
    },
  });
};

export const getSession = (sessionId: number) => {
  return axios.get(`/sessions/${sessionId}`);
};

export const postSession = (session: PostSessionRequest) => {
  const selectedCampaignId = useSelectedCampaignId();

  return axios.post("/sessions", {
    ...session,
    campaignId: selectedCampaignId.value,
  });
};

export const patchSession = (session: PatchSessionRequest) => {
  return axios.patch(`/sessions/${session.id}`, session);
};

export const deleteSession = (sessionId: number) => {
  return axios.delete(`/sessions/${sessionId}`);
};
