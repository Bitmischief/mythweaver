import { createAuth0 } from '@auth0/auth0-vue';
import type { Auth0Plugin } from '@auth0/auth0-vue';

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
  await auth0Client.logout();
  await auth0Client.loginWithRedirect();
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
