import axios from 'axios';

export const connectToDiscord = () => {
  return axios.get('/integrations/discord/connect');
};

export const disconnectFromDiscord = () => {
  return axios.post('/integrations/discord/disconnect');
};
