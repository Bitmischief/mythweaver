import axios from 'axios';

export const postToken = (credential: string, inviteCode: string | undefined) => {
  return axios.post('/auth/token', {
    type: 'GOOGLE',
    credential,
    inviteCode,
  });
};

export const postRefresh = (refreshToken: string) => {
  return axios.post('/auth/refresh', {
    refreshToken,
  });
};
