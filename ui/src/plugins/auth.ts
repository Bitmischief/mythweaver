import { createAuth0 } from '@auth0/auth0-vue';
import type { Auth0Plugin } from '@auth0/auth0-vue';
import { useAuthStore } from '@/store';
import { useRoute } from 'vue-router';

const auth0Client: Auth0Plugin = createAuth0({
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: `${window.location.origin}/auth/login`,
    audience: import.meta.env.VITE_API_URL,
  },
  useRefreshTokens: true,
  cacheLocation: 'localstorage',
});

export default auth0Client;

export const logout = async () => {
  const authStore = useAuthStore();
  const route = useRoute();
  const currentPath = route.path;

  await authStore.logout();
  await auth0Client.logout();
  await auth0Client.loginWithRedirect({
    authorizationParams: {
      screen_hint: 'login',
    },
    appState: {
      target: currentPath,
    },
  });
};

export const getAccessToken = async (options?: { cacheMode?: 'on' | 'off' }) => {
  return await auth0Client.getAccessTokenSilently(options);
};
