import axios from "axios";

export interface CharacterBase {
  id: number;
  name: string,
  looks: string,
  personality: string;
  background: string;
  imageUri?: string;
}

export const getCharacters = () => {
  return axios.get('/characters');
}

export const getCharacter = (characterId: number) => {
  return axios.get(`/characters/${characterId}`);
}

export const postGenerateCharacter = () => {
  return axios.post('/characters/generate/base');
}

export const postGenerateCharacterImage = (looks: string) => {
  return axios.post('/characters/generate/image', { looks });
}

export const postCharacter = (character: CharacterBase) => {
  return axios.post('/characters', character);
}
