import axios from "axios";

export interface CharacterBase {
  id: number;
  name: string;
  looks: string;
  personality: string;
  background: string;
  imageUri?: string;
  tags?: string[];
}

export interface GetCharactersRequest {
  term?: string;
  offset?: number;
  limit?: number;
}

export const getCharacters = (query: GetCharactersRequest) => {
  return axios.get("/characters", {
    params: query,
  });
};

export const getCharacter = (characterId: number) => {
  return axios.get(`/characters/${characterId}`);
};

export const postGenerateCharacter = () => {
  return axios.post("/characters/generate/base");
};

export const postGenerateCharacterImage = (looks: string) => {
  return axios.post("/characters/generate/image", { looks });
};

export const postCharacter = (character: CharacterBase) => {
  return axios.post("/characters", character);
};

export const patchCharacter = (character: CharacterBase) => {
  return axios.patch(`/characters/${character.id}`, character);
};

export const deleteCharacter = (characterId: number) => {
  return axios.delete(`/characters/${characterId}`);
};
