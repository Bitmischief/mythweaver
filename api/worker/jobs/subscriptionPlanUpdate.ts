import Queue from 'bull';
import { prisma } from '@/lib/providers/prisma';
import logger from '@/lib/logger';
import { config } from '@/worker/config';
import { User } from '@prisma/client';
import { processInChunks } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface SubscriptionPlanUpdateEvent {}

export const subscriptionPlanUpdateQueue =
  new Queue<SubscriptionPlanUpdateEvent>('subscription-plan-update', config);

subscriptionPlanUpdateQueue.process(async (job, done) => {
  logger.info('Processing nightly subscription plan update job');

  try {
    await updateSubscriptionPlans();
    logger.info('Completed processing nightly subscription plan update job');
    done();
  } catch (err) {
    logger.error('Error processing nightly subscription plan update job!', err);
    done(new Error('Error processing nightly subscription plan update job!'));
  }
});

const updateSubscriptionPlans = async () => {
  const currentDate = new Date();

  await processInChunks(
    10,
    (skip: number, take: number) =>
      prisma.user.findMany({
        where: {
          pendingPlanChangeEffectiveDate: {
            lte: currentDate,
          },
          pendingPlanChange: {
            not: null,
          },
        },
        skip,
        take,
      }),
    async (user: User) => {
      if (!user.pendingPlanChange) {
        logger.error(
          'Somehow received a user without a pending plan change, returning',
        );
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: user.pendingPlanChange,
          pendingPlanChange: null,
          pendingPlanChangeEffectiveDate: null,
        },
      });

      logger.info(
        `Updated user ${user.id} to ${user.pendingPlanChange} plan due to pending plan change`,
      );
    },
  );
};
