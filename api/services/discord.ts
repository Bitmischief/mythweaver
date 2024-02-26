import axios from 'axios';
import logger from '../lib/logger';

export const postToDiscordBillingChannel = async (message: string) => {
  // if (!isProduction) return;

  if (!process.env.DISCORD_BILLING_WEBHOOK) {
    logger.info('No Discord billing webhook configured. Skipping.');
    return;
  }

  logger.info('Posting message to Discord billing channel');

  await axios.post(process.env.DISCORD_BILLING_WEBHOOK || '', {
    content: message,
  });
};
