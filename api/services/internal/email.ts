import axios from 'axios';

export const addEmailToMailingList = async (email: string) => {
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
};

export const sendTransactionalEmail = async (
  email: string,
  template: string,
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
