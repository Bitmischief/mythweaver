import axios from 'axios';
import { useSelectedCampaignId } from '@/lib/hooks.ts';

export interface SessionBase {
  id: number;
  summary?: string | undefined;
  transcript?: string | undefined;
  planning?: string | undefined;
  campaignId: number;
  imageUri?: string | undefined;
  name?: string | undefined;
  status: 1 | 2;
  suggestions?: string | undefined;
}

export interface GetSessionsRequest {
  offset?: number;
  limit?: number;
}

export interface PostSessionRequest {
  id: number;
  name?: string | undefined;
  planning?: string | undefined;
  campaignId: number;
}

export interface PatchSessionRequest {
  id: number;
  name?: string | undefined;
  planning?: string | undefined;
  summary?: string | undefined;
  transcript?: string | undefined;
  description?: string | undefined;
  campaignId: number;
}

export interface PostCompleteSessionRequest {
  recap: string;
}

export const getSessions = (query: GetSessionsRequest) => {
  const selectedCampaignId = useSelectedCampaignId();

  return axios.get('/sessions', {
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

  return axios.post('/sessions', {
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

export const postCompleteSession = (sessionId: number, request: PostCompleteSessionRequest) => {
  return axios.post(`/sessions/${sessionId}/complete`, request);
};
