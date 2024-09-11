import axios from 'axios';

export const addEmailToMailingList = async (email: string) => {
  await axios.post(`${process.env.API_URL}/email-list`, {
    email,
    list: 'app',
  });
};

export const sendTransactionalEmail = async (
  email: string,
  template: string,
  params: {
    key: string;
    value: any;
  }[],
) => {
  await axios.post(`${process.env.API_URL}/email-list`, {
    email,
    template,
    params,
  });
};
