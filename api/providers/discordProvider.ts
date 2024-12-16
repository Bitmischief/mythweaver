import axios from 'axios';
import logger from '../lib/logger';
import { isProduction } from '../lib/environments';

export class DiscordProvider {
  async postToBillingChannel(message: string): Promise<void> {
    if (!isProduction) return;

    if (!process.env.DISCORD_BILLING_WEBHOOK) {
      logger.info('No Discord billing webhook configured. Skipping.');
      return;
    }

    logger.info('Posting message to Discord billing channel');

    await axios.post(process.env.DISCORD_BILLING_WEBHOOK || '', {
      content: message,
      flags: 1 << 2,
    });
  }
}
