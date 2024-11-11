import axios from 'axios';
import { getAccessToken, logout } from '@/plugins/auth';
import { API_URL } from '@/lib/util.ts';

axios.defaults.baseURL = API_URL;

axios.interceptors.request.use(
  async (config) => {
    if (config.url?.startsWith('/campaigns/invites/') && config.method === 'GET') {
      return config;
    }

    const token = await getAccessToken();

    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    if (
      window.location.pathname.includes('/invite') ||
      window.location.pathname.includes('/login')
    ) {
      return;
    }

    if (err.response?.status === 401) {
      try {
        const newToken = await getAccessToken({ cacheMode: 'off' });
        if (newToken) {
          const config = err.config;
          config.headers['Authorization'] = 'Bearer ' + newToken;
          return axios(config);
        } else {
          await logout();
        }
      } catch (refreshError) {
        await logout();
      }
    }

    return Promise.reject(err);
  },
);
