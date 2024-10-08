import axios from 'axios';

export const conjureImage = async (
  prompt: string,
  negativePrompt?: string,
  stylePreset?: string,
  count?: number,
  seed?: string,
  linking?: {
    sessionId?: number;
    conjurationId?: number;
    characterId?: number;
  },
  modelId?: number,
) => {
  return axios.post('/images', {
    prompt,
    negativePrompt,
    stylePreset,
    count,
    seed,
    linking,
    modelId,
  });
};

export const patchImageConjurationId = async (imageId: number, conjurationId: number) => {
  return axios.patch(`/images/${imageId}/conjurationId`, {
    conjurationId: conjurationId,
  });
};

export const postImageUpscale = async (imageId: number) => {
  return axios.post(`/images/${imageId}/upscale`);
};

export const patchPrimaryImage = async (imageId: number) => {
  return axios.patch(`/images/${imageId}/primary`);
};

export const getConjurationImageHistory = async (conjurationId: number) => {
  return axios.get(`/images/conjurations/${conjurationId}/history`);
};

export const getUserImageGallery = (offset = 0, limit = 50) => {
  return axios.get(`/images/gallery`, { params: { offset, limit } });
};
