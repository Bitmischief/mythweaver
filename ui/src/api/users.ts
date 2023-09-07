import axios from 'axios';

export interface User {
  id: number;
  email: string;
}

export const getCurrentUser = () => {
  return axios.get('/users/me');
};
