import axios from 'axios';

export const postSupportRequest = async (type: string, description: string) => {
  const response = await axios.post('/support', { type, description });
  return response.data;
};
