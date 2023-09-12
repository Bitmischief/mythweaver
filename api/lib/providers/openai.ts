import OpenAI from 'openai';

export const getClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
