import Queue from 'bull';
import { prisma } from '../../lib/providers/prisma';
import logger from '../../lib/logger';
import { config } from '../config';
import { BillingPlan } from '@prisma/client';
import { differenceInDays } from 'date-fns';
import { processInChunks } from '../../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SubscriptionCheckEvent {}

export const expiredSubscriptionCheckQueue = new Queue<SubscriptionCheckEvent>(
  'expired-subscription-check',
  config,
);

expiredSubscriptionCheckQueue.process(async (job, done) => {
  logger.info('Processing nightly subscription check job');

  try {
    await checkSubscriptions();
    logger.info('Completed processing nightly subscription check job');
    done();
  } catch (err) {
    logger.error('Error processing nightly subscription check job!', err);
    done(new Error('Error processing nightly subscription check job!'));
  }
});

const checkSubscriptions = async () => {
  const currentDate = new Date();

  await processInChunks(
    10,
    (skip: number, take: number) =>
      prisma.user.findMany({
        where: {
          subscriptionPaidThrough: {
            lt: currentDate,
          },
          plan: {
            not: BillingPlan.FREE,
          },
        },
        skip,
        take,
      }),
    async (user) => {
      if (!user.subscriptionPaidThrough) {
        return;
      }

      const daysSinceExpiration = differenceInDays(
        currentDate,
        user.subscriptionPaidThrough,
      );

      if (daysSinceExpiration >= 1) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: BillingPlan.FREE },
        });

        logger.info(
          `Updated user ${user.id} to FREE plan due to expired subscription`,
        );
      }
    },
  );
};
