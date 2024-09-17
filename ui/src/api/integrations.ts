import axios from 'axios';

export const connectToDiscord = () => {
  return axios.get('/integrations/discord/connect');
};
