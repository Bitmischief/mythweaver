import { auth } from 'express-oauth2-jwt-bearer';

export const checkAuth0Jwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  authRequired: true,
});
