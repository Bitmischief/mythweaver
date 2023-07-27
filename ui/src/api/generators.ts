import axios from "axios";

export interface Summoner {
  code: string;
  name: string;
  description: string;
  imageUri?: string;
  parent: Summoner | null;
}

export const getSummoners = () => {
  return axios.get("/generators");
};

export const getSummoner = (code: string) => {
  return axios.get(`/generators/${code}`);
};

export interface PostSummonerSummonRequest {
  campaignId: number;
  customArgs?: CustomArg[];
}

export interface CustomArg {
  key: string;
  value: any;
}

export const postSummonerSummon = (code: string, payload: PostSummonerSummonRequest) => {
  return axios.post(`/generators/${code}/generate`, payload);
};
