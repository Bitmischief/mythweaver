import axios from "axios";
import { Ref } from "vue";

export interface RpgSystem {
  id: number;
  name: string;
  version: string;
  imageUri?: string;
  tags: string[];
  releaseDate: Date;
  relevance: number;
}

export interface GetRpgSystemsRequest {
  term?: Ref<string>;
  offset?: number;
  limit?: number;
}

export const getRpgSystems = (query: GetRpgSystemsRequest) => {
  return axios.get("/rpg-systems", {
    params: {
      term: query.term?.value,
      offset: query.offset,
      limit: query.limit,
    },
  });
};

export interface GetAdventuresRequest {
  rpgSystemId: number;
  term?: Ref<string>;
  offset?: number;
  limit?: number;
}

export const getAdventures = (query: GetAdventuresRequest) => {
  return axios.get(`/rpg-systems/${query.rpgSystemId}/adventures`, {
    params: {
      term: query.term?.value,
      offset: query.offset,
      limit: query.limit,
    },
  });
};
