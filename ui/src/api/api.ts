import axios from 'axios';
import { useAuthStore } from '@/store';
import { storeToRefs } from 'pinia';

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

axios.interceptors.request.use(
  (config) => {
    if (config.url !== '/auth/token' && config.url !== '/auth/refresh') {
      if (config.url?.startsWith('/campaigns/invites/') && config.method === 'GET') {
        return config;
      }

      const authStore = useAuthStore();
      const { tokens } = storeToRefs(authStore);

      if (!tokens.value) {
        return config;
      }

      const token = (tokens as any).value.access_token;

      if (token) {
        config.headers['Authorization'] = token;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const MAX_REFRESH_RETRIES = 5;
let refreshPromise: Promise<void> | null = null;

axios.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config || {};
    originalConfig._retryCount = originalConfig?._retryCount || 0;
    const authStore = useAuthStore();

    if (originalConfig.url === '/auth/refresh' && err.response.status === 401) {
      await authStore.logout();
      return;
    }

    if (originalConfig.url !== '/auth/token' && err.response) {
      // Access Token was expired
      if (
        err.response.status === 401 &&
        !originalConfig._retry &&
        originalConfig._retryCount < MAX_REFRESH_RETRIES
      ) {
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalConfig);
        }

        originalConfig._retry = true;
        originalConfig._retryCount++;

        try {
          refreshPromise = authStore.refresh();
          await refreshPromise;
          refreshPromise = null;
          return axios(originalConfig);
        } catch (_error) {
          return Promise.reject(_error);
        }
      }
    }

    return Promise.reject(err);
  },
);
