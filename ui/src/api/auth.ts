import axios from 'axios';

export const postToken = (
  type: 'GOOGLE' | 'MAGIC_LINK',
  credential: string,
  inviteCode: string | undefined,
) => {
  return axios.post('/auth/token', {
    type,
    credential,
    inviteCode,
  });
};

export const postRefresh = (refreshToken: string) => {
  return axios.post('/auth/refresh', {
    refreshToken,
  });
};

export const postMagicLink = (email: string, inviteCode: string | undefined) => {
  return axios.post('/auth/magic-link', {
    email,
    inviteCode,
  });
};
