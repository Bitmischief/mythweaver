import axios from 'axios';
import { isProduction } from '@/modules/core/utils/environments';
import { Logger } from '@/modules/core/logging/logger';

export class DiscordProvider {
  constructor(private logger: Logger) {}

  async postToBillingChannel(message: string): Promise<void> {
    if (!isProduction) return;

    if (!process.env.DISCORD_BILLING_WEBHOOK) {
      this.logger.info('No Discord billing webhook configured. Skipping.');
      return;
    }

    this.logger.info('Posting message to Discord billing channel');

    await axios.post(process.env.DISCORD_BILLING_WEBHOOK || '', {
      content: message,
      flags: 1 << 2,
    });
  }
}
