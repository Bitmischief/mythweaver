import logger from '../../lib/logger';
import axios from 'axios';

export enum EmailTemplates {
  CAMPAIGN_INVITE = 'campaign-invite',
  CAMPAIGN_POST_SESSION = 'campaign-post-session',
  SUBSCRIBER_WELCOME = 'subscriber-welcome',
}

export const addEmailToMailingList = async (email: string) => {
  try {
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
  } catch(err) {
    logger.error('Error adding email to mailing list', {}, err);
  }
};

export const sendTransactionalEmail = async (
  email: string,
  template: EmailTemplates,
  params: {
    key: string;
    value: any;
  }[],
) => {
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
};
