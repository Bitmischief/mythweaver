import axios from 'axios';

export const conjureImage = async (prompt: string) => {
  return axios.post('/images', {
    prompt,
  });
};
