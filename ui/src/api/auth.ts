import axios from 'axios';

export const postToken = (
  type: 'MAGIC_LINK',
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
