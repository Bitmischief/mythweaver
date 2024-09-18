export const isProduction = process.env.API_URL === 'https://api.mythweaver.co';
export const isDevelopment =
  process.env.API_URL === 'https://dev-api.mythweaver.co';
export const isLocalDevelopment =
  process.env.API_URL === 'http://localhost:8000';