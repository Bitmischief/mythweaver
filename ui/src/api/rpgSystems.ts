import axios from 'axios';
import { Ref } from 'vue';
import { PublicAdventure } from '@/api/campaigns.ts';

export interface RpgSystem {
  code: string;
  name: string;
  versions: string[];
  imageUri?: string;
  tags: string[];
  releaseDate: Date;
  relevance: number;
  publicAdventures: PublicAdventure[];
}

export interface GetRpgSystemsRequest {
  term?: Ref<string>;
  offset?: number;
  limit?: number;
}

export const getRpgSystems = (query: GetRpgSystemsRequest) => {
  return axios.get('/rpg-systems', {
    params: {
      term: query.term?.value,
      offset: query.offset,
      limit: query.limit,
    },
  });
};
