import { prisma } from '../../lib/providers/prisma';
import { BillingPlan, User } from '@prisma/client';
import logger from '../../lib/logger';

export const endTrials = async () => {
  logger.info('Processing end trial job');

  let skip = 0;
  const take = 10;
  let users = [];

  do {
    users = await prisma.user.findMany({
      where: {
        trialEndsAt: {
          lte: new Date(),
        },
      },
      skip,
      take,
    });

    logger.info(`Processing ${users.length} users.`, { users });

    for (const user of users) {
      await endTrial(user);
    }

    skip += users.length;
  } while (users.length === 10);
};

const endTrial = async (user: User) => {
  logger.info(`Ending trial for user ${user.email}`, { userId: user.id });
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      trialEndsAt: null,
      plan: BillingPlan.FREE,
    },
  });
};
