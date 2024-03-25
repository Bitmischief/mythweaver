import { Client, Operators } from 'intercom-client';
import { isLocalDevelopment } from './utils';
import { prisma } from './providers/prisma';
import { AppError, HttpCode } from './errors/AppError';
import logger from './logger';

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
      if (
        e.message.startsWith(
          'A contact matching those details already exists with id=',
        )
      ) {
        const id = e.message.split(
          'A contact matching those details already exists with id=',
        )[1];
        logger.info('Updating intercom contact with id=', id);
        await intercomClient.contacts.update({
          id: id,
          externalId: userId.toString(),
          customAttributes: attributes,
        });
      } else {
        logger.error('Something went wrong creating intercom contact', e);
      }
    }
  } else {
    await intercomClient.contacts.update({
      id: existingContactSearchResponse.data[0].id,
      externalId: userId.toString(),
      customAttributes: attributes,
    });
  }
};
