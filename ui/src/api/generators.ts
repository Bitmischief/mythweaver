import axios from "axios";

export interface Conjurer {
  code: string;
  name: string;
  description: string;
  imageUri?: string;
}

export const getConjurers = () => {
  return axios.get("/generators");
};

export const getConjurer = (code: string) => {
  return axios.get(`/generators/${code}`);
};

export interface PostConjureRequest {
  count: number;
  campaignId: number;
  customArgs?: CustomArg[];
}

export interface CustomArg {
  key: string;
  value: any;
}

export const postConjure = (code: string, payload: PostConjureRequest) => {
  return axios.post(`/generators/${code}/generate`, payload);
};

export const postQuickConjure = (code: string) => {
  return axios.post(`/generators/${code}/generate/quick`, {});
};

export const getConjurationRequest = (conjurationRequestId: number) => {
  return axios.get(`/generators/requests/${conjurationRequestId}`);
};
