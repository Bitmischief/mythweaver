import axios from 'axios';

export const conjureImage = async (
  prompt: string,
  negativePrompt?: string,
  stylePreset?: string,
  count?: number,
) => {
  return axios.post('/images', {
    prompt,
    negativePrompt,
    stylePreset,
    count,
  });
};

export const patchImageConjurationId = async (imageId: number, conjurationId: number) => {
  return axios.patch(`/images/${imageId}/conjurationId`, {
    conjurationId: conjurationId,
  });
};
