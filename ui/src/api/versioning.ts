import axios from 'axios';

export const getVersion = () => {
  return axios.get('/version');
};
