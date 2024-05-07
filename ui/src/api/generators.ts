import axios from 'axios';

export interface Conjurer {
  code: string;
  name: string;
  description: string;
  customizationHelpPrompt?: string;
  imageUri?: string;
  supportedImageStylePresets?: string[];
  proOnly?: boolean;
  experimental?: boolean;
}

export const getConjurers = () => {
  return axios.get('/generators');
};

export const getConjurer = (code: string) => {
  return axios.get(`/generators/${code}`);
};

export interface PostConjureRequest {
  count: number;
  campaignId: number;
  customArg?: string;
  imageStylePreset?: string;
  imagePrompt?: string;
  imageNegativePrompt?: string;
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

export interface PostGenerateArbitraryRequest {
  background: any;
  context: string;
  propertyName: string;
}

export interface PostGenerateArbitraryFromPromptRequest {
  background: any;
  context: string;
  propertyName: string;
}

export const postGenerateArbitrary = (request: PostGenerateArbitraryRequest) => {
  return axios.post(`/generators/arbitrary`, request);
};

export const postGenerateArbitraryFromPrompt = (
  request: PostGenerateArbitraryFromPromptRequest,
) => {
  return axios.post(`/generators/arbitrary/prompt`, request);
};

export const postMagicLinkGeneration = (magicLink: string) => {
  return axios.post(`/generators/magic-link/${magicLink}`);
};
