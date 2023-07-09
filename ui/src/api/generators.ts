import axios from "axios";

export interface Generator {
  id: number;
  name: string;
  description: string;
  imageUri?: string;
  parent: Generator | null;
}

export const getGenerators = (parentId: number | undefined = undefined) => {
  return axios.get("/generators", {
    params: {
      parentId,
    },
  });
};

export const getGenerator = (id: number) => {
  return axios.get(`/generators/${id}`);
};

export interface PostGeneratorGenerateRequest {
  campaignId: number;
  customData?: any;
}

export const postGeneratorGenerate = (id: number, payload: PostGeneratorGenerateRequest) => {
  return axios.post(`/generators/${id}/generate`, payload);
};
