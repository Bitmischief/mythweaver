import axios from "axios";

export interface Character {
  name: string,
  type: CharacterTypes,
  race: string;
  alignment: string;
  class: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hitPoints: number;
  armorClass: number;
  speed: number;
}

export enum CharacterTypes {
  Dnd5e = 0,
}

export const getCharacters = () => {
  return axios.get('/characters');
}

export const postGenerateCharacter = () => {
  return axios.post('/characters/generate');
}

export const postCharacter = (character: Character) => {
  return axios.post('/characters', character);
}
