import { Logger } from '@/modules/core/logging/logger';
import axios from 'axios';

export enum EmailTemplates {
  CAMPAIGN_INVITE = 'campaign-invite',
  CAMPAIGN_POST_SESSION = 'campaign-post-session',
  SUBSCRIBER_WELCOME = 'subscriber-welcome',
}

export class EmailProvider {
  constructor(private logger: Logger) {}

  async addEmailToMailingList(email: string) {
    this.logger.info('Adding email to mailing list', { email });

    await axios.post(
      `${process.env.API_URL}/email-signups/email-list`,
      {
        email,
        list: 'app',
      },
      {
        headers: {
          'x-mw-token': process.env.INTERNAL_EMAIL_SERVICE_TOKEN,
        },
      },
    );
  }

  async sendTransactionalEmail(
    email: string,
    template: EmailTemplates,
    params: {
      key: string;
      value: any;
    }[],
  ): Promise<void> {
    this.logger.info('Sending transactional email', {
      email,
      template,
      params,
    });

    await axios.post(
      `${process.env.API_URL}/email-signups/transactional`,
      {
        email,
        template,
        params,
      },
      {
        headers: {
          'x-mw-token': process.env.INTERNAL_EMAIL_SERVICE_TOKEN,
        },
      },
    );
  }
}
