import { Client } from 'intercom-client';
const intercomClient = new Client({ tokenAuth: { token: 'my_token' } });

export const setIntercomCustomAttributes = async (
  userId: number,
  attributes: any,
) => {
  await intercomClient.contacts.update({
    id: userId.toString(),
    customAttributes: attributes,
  });
};
