import {
  BillingInterval,
  BillingPlan,
  ProcessedStripeEvents,
  User,
} from '@prisma/client';
import { prisma } from '../../lib/providers/prisma';
import { AppError, HttpCode } from '../../lib/errors/AppError';

export class BillingDataProvider {
  async findProcessedStripeEvent(
    eventId: string,
  ): Promise<ProcessedStripeEvents | null> {
    return prisma.processedStripeEvents.findUnique({
      where: { eventId },
    });
  }

  async createProcessedStripeEvent(
    eventId: string,
    data: any,
  ): Promise<ProcessedStripeEvents> {
    return prisma.processedStripeEvents.create({
      data: { eventId, data },
    });
  }

  async deleteProcessedStripeEvent(id: number): Promise<void> {
    await prisma.processedStripeEvents.delete({ where: { id } });
  }

  async getUserByBillingCustomerId(billingCustomerId: string): Promise<User> {
    const user = await prisma.user.findFirst({ where: { billingCustomerId } });

    if (!user) {
      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    return user;
  }

  async updateUserSubscription(
    userId: number,
    data: {
      subscriptionPaidThrough?: Date;
      pendingPlanChange?: BillingPlan;
      pendingPlanChangeEffectiveDate?: Date;
      plan?: BillingPlan;
      planInterval?: BillingInterval;
      trialEndsAt?: Date | null;
      preorderRedemptionCoupon?: string | null;
      preorderRedemptionStripePriceId?: string | null;
    },
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async getLatestCampaignForUser(
    userId: number,
  ): Promise<{ name: string } | null> {
    return prisma.campaign.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { name: true },
    });
  }
}
