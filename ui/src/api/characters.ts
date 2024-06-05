import axios from 'axios';
import { useSelectedCampaignId } from '@/lib/hooks.ts';

export interface Character {
  id: number;
  imageUri: string;
  name: string;
  age?: number;
  race?: string;
  class?: string;
  backstory?: string;
  personality?: string;
  looks?: string;
  campaignMemberId?: number;
  userId: number;
  images?: any[];
  user?: any;
}

export const getCurrentCampaignCharacter = () => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.get(`/campaigns/${selectedCampaignId.value}/character`);
};

export const getCampaignCharacter = (characterId: number) => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.get(`/campaigns/${selectedCampaignId.value}/character/${characterId}`);
};

export const getCurrentCampaignCharacters = () => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.get(`/campaigns/${selectedCampaignId.value}/characters`);
};

export interface PostCharactersRequest {
  name: string;
  age?: number;
  race?: string;
  class?: string;
  imageUri?: string;
  backstory?: string;
  personality?: string;
  looks?: string;
}

export const postCharacters = (request: PostCharactersRequest) => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.post(`/characters`, {
    campaignId: selectedCampaignId.value,
    ...request,
  });
};

export interface PatchCharactersRequest {
  name: string;
  age?: number;
  race?: string;
  class?: string;
  imageUri?: string;
  backstory?: string;
  personality?: string;
  looks?: string;
}

export const patchCharacters = (characterId: number, request: PatchCharactersRequest) => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.patch(`/characters/${characterId}`, {
    campaignId: selectedCampaignId.value,
    ...request,
  });
};

export const deleteCharacters = (characterId: number) => {
  return axios.delete(`/characters/${characterId}`);
};
