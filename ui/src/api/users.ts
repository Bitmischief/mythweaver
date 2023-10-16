import axios from 'axios';

export interface User {
  id: number;
  email: string;
  createdAt: string;
  earlyAccessCutoffAt: string;
  earlyAccessExempt: boolean;
}

export const getCurrentUser = () => {
  return axios.get('/users/me');
};
