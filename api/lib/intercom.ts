import { Client } from 'intercom-client';
import { isLocalDevelopment } from './utils';
const intercomClient = new Client({
  tokenAuth: { token: process.env.INTERCOM_ACCESS_TOKEN || '' },
});

export const setIntercomCustomAttributes = async (
  userId: number,
  attributes: any,
) => {
  if (!isLocalDevelopment) {
    await intercomClient.contacts.update({
      id: userId.toString(),
      customAttributes: attributes,
    });
  }
};
