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
}

export const getCurrentCampaignCharacter = () => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.get(`/campaigns/${selectedCampaignId.value}/character`);
};

export interface PostCharactersRequest {
  name: string;
  imageUri: string;
  background: string;
  personality: string;
  looks: string;
}

export const postCharacters = (request: PostCharactersRequest) => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.post(`/characters`, {
    campaignId: selectedCampaignId.value,
    ...request,
  });
};

export interface PatchCharactersRequest {
  name?: string;
  imageUri?: string;
  background?: string;
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
