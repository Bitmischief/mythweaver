import axios from 'axios';

export interface Conjurer {
  code: string;
  name: string;
  description: string;
  customizationHelpPrompt?: string;
  imageUri?: string;
  supportedImageStylePresets?: string[];
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

export const postConjure = async (code: string, payload: PostConjureRequest) => {
  try {
    const response = await axios.post(`/generators/${code}/generate`, payload);
    return response;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      return error;
    }
  }
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

export const postGenerateArbitrary = (request: PostGenerateArbitraryRequest) => {
  return axios.post(`/generators/arbitrary`, request);
};
