import axios from 'axios';
import { useSelectedCampaignId } from '@/lib/hooks.ts';

export interface Character {
  id: number;
  name: string;
}

export const getCurrentCampaignCharacter = () => {
  const selectedCampaignId = useSelectedCampaignId();
  return axios.get(`/campaigns/${selectedCampaignId.value}/character`);
};
