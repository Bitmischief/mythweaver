import axios from 'axios';

export const getImageModels = async () => {
  return axios.get(`/models/images`);
};
