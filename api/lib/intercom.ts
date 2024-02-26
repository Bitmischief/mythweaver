import { Client, Operators } from 'intercom-client';
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

  const existingContactSearchResponse = await intercomClient.contacts.search({
    data: {
      query: {
        field: 'external_id',
        operator: Operators.EQUALS,
        value: userId.toString(),
      },
    },
  });

  if (!existingContactSearchResponse.data.length) {
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
