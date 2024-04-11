import { prisma } from './providers/prisma';
import { sendWebsocketMessage, WebSocketEvent } from '../services/websockets';
import { AppError, HttpCode } from './errors/AppError';
import { BillingPlan } from '@prisma/client';
import { FreeTierConjurationLimit } from '../data/limits';
import { OpenFeature } from '@openfeature/server-sdk';

const featureFlags = OpenFeature.getClient();

export const sendConjurationCountUpdatedEvent = async (userId: number) => {
  const userConjurationCount = await prisma.conjuration.count({
    where: {
      OR: [
        {
          userId: userId,
        },
        {
          saves: {
            some: {
              userId: userId,
            },
          },
        },
      ],
    },
  });
  await sendWebsocketMessage(
    userId,
    WebSocketEvent.UserConjurationCountUpdated,
    userConjurationCount,
  );
};

export const validateConjurationCountRestriction = async (userId: number) => {
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

  const context = {
    kind: 'user',
    key: user.id.toString(),
    email: user.email,
    name: user.username,
    custom: {
      plan: user.plan,
    },
  };
  const flag = await featureFlags.getBooleanValue(
    'free-tier-conjuration-limit',
    false,
    context,
  );
  if (!flag) {
    return;
  }

  if (user.plan === BillingPlan.FREE) {
    const conjurationCount = await prisma.conjuration.count({
      where: {
        OR: [
          {
            userId: user.id,
          },
          {
            saves: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
    });
    if (conjurationCount >= FreeTierConjurationLimit) {
      throw new AppError({
        name: 'CONJURATION_LIMIT_REACHED',
        description: 'You have reached the limit of conjurations you can save.',
        httpCode: HttpCode.FORBIDDEN,
      });
    }
  }
};
