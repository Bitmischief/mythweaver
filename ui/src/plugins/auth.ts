import { createAuth0 } from '@auth0/auth0-vue';
import type { Auth0Plugin } from '@auth0/auth0-vue';
import { useAuthStore } from '@/store';
import { API_URL } from '@/lib/util.ts';

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
  await authStore.logout();
  await auth0Client.logout();
  await auth0Client.loginWithRedirect({
    authorizationParams: {
      screen_hint: 'login',
    },
    appState: {
      target: `/conjure`,
    },
  });
};

export const getAccessToken = async () => {
  let token = null;
  try {
    token = await auth0Client.getAccessTokenSilently();
  } catch (e) {
    console.log('No access token');
  }
  return token;
};
