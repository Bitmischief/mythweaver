import { Client } from 'intercom-client';
import { isLocalDevelopment } from './utils';
import { prisma } from './providers/prisma';
import { AppError, HttpCode } from './errors/AppError';
const intercomClient = new Client({
  tokenAuth: { token: process.env.INTERCOM_ACCESS_TOKEN || '' },
});

export const setIntercomCustomAttributes = async (
  userId: number,
  attributes: any,
) => {
  if (isLocalDevelopment) {
    return;
  }

  const contact = await intercomClient.contacts.find({ id: userId.toString() });

  if (!contact) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found.',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    await intercomClient.contacts.createUser({
      externalId: userId.toString(),
      email: user.email,
      customAttributes: attributes,
    });
  } else {
    await intercomClient.contacts.update({
      id: userId.toString(),
      customAttributes: attributes,
    });
  }
};
