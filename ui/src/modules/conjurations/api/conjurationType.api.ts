import axios from 'axios';

export const getConjurationTypes = () => {
  return axios.get('/generators');
};

export const getConjurationType = (type: string) => {
  return axios.get(`/generators/${type}`);
};
