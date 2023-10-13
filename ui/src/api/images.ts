import axios from 'axios';

export const conjureImage = async (
  prompt: string,
  negativePrompt?: string,
  stylePreset?: string,
) => {
  return axios.post('/images', {
    prompt,
    negativePrompt,
    stylePreset,
  });
};
