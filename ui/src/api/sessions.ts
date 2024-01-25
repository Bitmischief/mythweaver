import axios from 'axios';
import { useSelectedCampaignId } from '@/lib/hooks.ts';

export interface SessionBase {
  id: number;
  processing: boolean;
  archived: boolean;
  completed: boolean;
  name?: string | undefined;
  planning?: string | undefined;
  recap?: string | undefined;
  summary?: string | undefined;
  transcript?: string | undefined;
  campaignId: number;
  imageUri?: string | undefined;
  suggestions?: string | undefined;

  suggestedName?: string | undefined;
  suggestedSummary?: string | undefined;
  suggestedTranscript?: string | undefined;
  suggestedImageUri?: string | undefined;
  suggestedSuggestions?: string | undefined;
  suggestedImagePrompt?: string | undefined;
  audioName?: string | undefined;
  audioUri?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface GetSessionsRequest {
  offset?: number;
  limit?: number;
}

export interface PostSessionRequest {
  name?: string | undefined;
}

export interface PatchSessionRequest {
  id: number;
  name?: string | undefined;
  planning?: string | undefined;
  summary?: string | undefined;
  transcript?: string | undefined;
  description?: string | undefined;
  campaignId?: number;
  archived?: boolean | undefined;
  imageUri?: string | undefined;
  suggestions?: string | undefined;

  suggestedName?: string | undefined;
  suggestedSummary?: string | undefined;
  suggestedTranscript?: string | undefined;
  suggestedImageUri?: string | undefined;
  suggestedSuggestions?: string | undefined;
  suggestedImagePrompt?: string | undefined;
}

export interface PostGenerateSummaryRequest {
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

export const postGenerateSummary = (sessionId: number, request: PostGenerateSummaryRequest) => {
  return axios.post(`/sessions/${sessionId}/generate-summary`, request);
};

export const postCompleteSession = (sessionId: number) => {
  return axios.post(`/sessions/${sessionId}/complete`);
};

export const postSessionAudio = (sessionId: number, request: FormData) => {
  return axios.post(`/sessions/${sessionId}/audio`, request);
};
