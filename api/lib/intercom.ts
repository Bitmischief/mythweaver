import { Client, Operators } from 'intercom-client';
import { isLocalDevelopment } from '@/lib/environments';
import { prisma } from '@/lib/providers/prisma';
import { AppError, HttpCode } from '@/lib/errors/AppError';
import logger from '@/lib/logger';

const createIntercomClient = () => {
  if (process.env.NODE_ENV === 'test' || !process.env.INTERCOM_ACCESS_TOKEN) {
    return null;
  }
  return new Client({
    tokenAuth: { token: process.env.INTERCOM_ACCESS_TOKEN },
  });
};

export const intercomClient = createIntercomClient();

export const setIntercomCustomAttributes = async (
  userId: number,
  attributes: any,
) => {
  if (isLocalDevelopment || !intercomClient) {
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

  logger.info('Queried intercom for contacts', {
    existingContactSearchResponse,
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

    logger.info('Creating new intercom contact');
    try {
      await intercomClient.contacts.createUser({
        externalId: userId.toString(),
        email: user.email,
        customAttributes: attributes,
      });
    } catch (e: any) {
      if (e.status === 409) {
        const id =
          e.message.split(
            'A contact matching those details already exists with id=',
          )[1] ?? null;
        if (id) {
          logger.info('Updating intercom contact with id=', id);
          await intercomClient.contacts.update({
            id: id,
            externalId: userId.toString(),
            customAttributes: attributes,
          });
          return;
        }
      }

      logger.error('Something went wrong creating intercom contact', e);
    }
  } else {
    await intercomClient.contacts.update({
      id: existingContactSearchResponse.data[0].id,
      externalId: userId.toString(),
      customAttributes: attributes,
    });
  }
};
