import { ImageCreditChangeType, User } from '@prisma/client';
import { prisma } from '../../lib/providers/prisma';
import { modifyImageCreditCount } from '../../services/credits';
import logger from '../../lib/logger';

export const processLifetimeSubscriptionCredits = async () => {
  const chunkSize = 100;
  let skip = 0;
  let users: User[];

  do {
    users = await prisma.user.findMany({
      where: {
        lifetimeAccess: true,
      },
      take: chunkSize,
      skip,
    });

    for (const user of users) {
      await incrementLifetimeSubscriptionCredits(user);
    }

    skip += users.length;
  } while (users.length > 0);
};

const incrementLifetimeSubscriptionCredits = async (user: User) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const existingCreditAdd = await prisma.imageCreditAuditLog.findFirst({
    where: {
      userId: user.id,
      type: ImageCreditChangeType.SUBSCRIPTION,
      createdAt: {
        gte: yesterday,
      },
    },
  });

  if (existingCreditAdd) {
    logger.info('Lifetime subscription credits already added today for user', {
      userId: user.id,
    });
    return;
  }

  await modifyImageCreditCount(
    user.id,
    300,
    ImageCreditChangeType.SUBSCRIPTION,
    'Lifetime subscription credits added monthly by worker process',
  );
};
