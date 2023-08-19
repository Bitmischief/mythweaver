import axios from "axios";
import { useSelectedCampaignId } from "@/lib/hooks.ts";

export interface CharacterBase {
  id: number;
  name: string;
  looks: string;
  personality: string;
  background: string;
  imageUri?: string;
  tags?: string[];
  imageAIPrompt?: string;
}

export interface GetCharactersRequest {
  term?: string;
  offset?: number;
  limit?: number;
}

export const getCharacters = (query: GetCharactersRequest) => {
  const selectedCampaignId = useSelectedCampaignId();

  return axios.get("/characters", {
    params: {
      ...query,
      campaignId: selectedCampaignId.value,
    },
  });
};

export const getCharacter = (characterId: number) => {
  return axios.get(`/characters/${characterId}`);
};

export const postGenerateCharacter = () => {
  return axios.post("/characters/generate/base");
};

export const postGenerateCharacterImage = (looks: string) => {
  return axios.post("/generators/image", { looks });
};

export const postCharacter = (character: CharacterBase) => {
  const selectedCampaignId = useSelectedCampaignId();

  return axios.post("/characters", {
    ...character,
    campaignId: selectedCampaignId.value,
  });
};

export const patchCharacter = (character: CharacterBase) => {
  return axios.patch(`/characters/${character.id}`, character);
};

export const deleteCharacter = (characterId: number) => {
  return axios.delete(`/characters/${characterId}`);
};
