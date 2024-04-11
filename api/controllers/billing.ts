import {
  Body,
  Get,
  Inject,
  Post,
  Queries,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import {
  createCustomer,
  getBillingPortalUrl,
  GetBillingPortalUrlRequest,
  getCheckoutUrl,
  getImageCreditCountForProductId,
  getPlanForProductId,
  getPreorderRedemptionSessionUrl,
  getSessionLineItems,
  getSubscription,
} from '../services/billing';
import Stripe from 'stripe';
import {
  BillingInterval,
  BillingPlan,
  ImageCreditChangeType,
  User,
} from '@prisma/client';
import logger, { MythWeaverLogger } from '../lib/logger';
import { setIntercomCustomAttributes } from '../lib/intercom';
import { modifyImageCreditCount } from '../services/credits';
import { postToDiscordBillingChannel } from '../services/discord';

const PRO_PLAN_IMAGE_CREDITS = 300;
const BASIC_PLAN_IMAGE_CREDITS = 100;

@Route('billing')
@Tags('Billing')
export default class BillingController {
  @Post('/checkout-url')
  @SuccessResponse('200', 'Success')
  public async getCheckoutUrl(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
    @Body()
    body: {
      priceId: string;
      subscription: boolean;
    },
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      logger.warn("Couldn't find user for id", userId);

      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (!user.billingCustomerId) {
      user.billingCustomerId = await createCustomer(user.email);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          billingCustomerId: user.billingCustomerId,
        },
      });
    }

    return await getCheckoutUrl(
      user.billingCustomerId,
      body.priceId,
      body.subscription,
    );
  }

  @Get('/redeem-preorder-url')
  @SuccessResponse('200', 'Success')
  public async getRedeemPreOrderUrl(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
    @Inject() logger: MythWeaverLogger,
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      logger.warn("Couldn't find user for id", userId);

      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (
      !user.preorderRedemptionCoupon ||
      !user.preorderRedemptionStripePriceId
    ) {
      throw new AppError({
        description: 'User does not have a preorder redemption coupon',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (!user.billingCustomerId) {
      user.billingCustomerId = await createCustomer(user.email);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          billingCustomerId: user.billingCustomerId,
        },
      });
    }

    return await getPreorderRedemptionSessionUrl(
      user.billingCustomerId,
      user.preorderRedemptionStripePriceId,
      user.preorderRedemptionCoupon,
    );
  }

  @Get('/portal-url')
  @SuccessResponse('200', 'Success')
  public async getPortalUrl(
    @Inject() userId: number,
    @Inject() logger: MythWeaverLogger,
    @Queries() request: GetBillingPortalUrlRequest,
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      logger.warn("Couldn't find user for id", userId);

      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.NOT_FOUND,
      });
    }

    if (!user.billingCustomerId) {
      user.billingCustomerId = await createCustomer(user.email);
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          billingCustomerId: user.billingCustomerId,
        },
      });
    }

    return await getBillingPortalUrl(user.billingCustomerId, request);
  }

  public async processWebhook(event: Stripe.Event, logger: MythWeaverLogger) {
    logger.info('Processing Stripe webhook event', { event });

    const existingStripeEvent = await prisma.processedStripeEvents.findUnique({
      where: {
        eventId: event.id,
      },
    });

    if (existingStripeEvent) {
      logger.info(`Already processed stripe event ${event.id}, ignoring.`);
      return;
    }

    const stripeEventLog = await prisma.processedStripeEvents.create({
      data: {
        eventId: event.id,
        data: event as any,
      },
    });

    try {
      if (event.type === 'checkout.session.completed') {
        await this.processCheckoutSessionCompletedEvent(event, logger);
      } else if (
        event.type === 'customer.subscription.deleted' ||
        event.type === 'customer.subscription.resumed'
      ) {
        await this.processSubscriptionDeletedOrResumedEvent(event);
      } else if (event.type === 'customer.subscription.paused') {
        await this.processSubscriptionPausedEvent(event);
      } else if (event.type === 'customer.subscription.updated') {
        await this.processSubscriptionUpdatedEvent(event);
      } else if (event.type === 'invoice.paid') {
        await this.processInvoicePaidEvent(event, logger);
      }
    } catch (err) {
      logger.error('Error processing stripe event', { error: err });
      await prisma.processedStripeEvents.delete({
        where: { id: stripeEventLog.id },
      });
    }
  }

  private async processCheckoutSessionCompletedEvent(
    event: Stripe.CheckoutSessionCompletedEvent,
    logger: MythWeaverLogger,
  ) {
    logger.info('Checkout session completed', { event });

    const session = event.data.object;

    const lineItems = await getSessionLineItems(session.id);

    const imageCreditPack100 = lineItems.data.find(
      (d: any) =>
        d.price?.product === process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID,
    );

    if (imageCreditPack100) {
      await processItemPaid(
        event.data.object.customer as string,
        imageCreditPack100.price.product,
        event.data.object.amount_total || 0 / 100,
        imageCreditPack100.quantity,
        logger,
      );
    }
  }

  private async processSubscriptionDeletedOrResumedEvent(
    event:
      | Stripe.CustomerSubscriptionDeletedEvent
      | Stripe.CustomerSubscriptionResumedEvent,
  ) {
    const user = await prisma.user.findFirst({
      where: {
        billingCustomerId: event.data.object.customer as string,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    const planRenewalDate = new Date(event.data.object.current_period_end);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        subscriptionPaidThrough: planRenewalDate,
      },
    });

    await setIntercomCustomAttributes(user.id, {
      'Plan Renewal Date': planRenewalDate,
    });
  }

  private async processSubscriptionPausedEvent(
    event: Stripe.CustomerSubscriptionPausedEvent,
  ) {
    const user = await prisma.user.findFirst({
      where: {
        billingCustomerId: event.data.object.customer as string,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        subscriptionPaidThrough: new Date(),
      },
    });

    await setIntercomCustomAttributes(user.id, {
      'Plan Renewal Date': new Date(),
    });
  }

  private async processSubscriptionUpdatedEvent(
    event: Stripe.CustomerSubscriptionUpdatedEvent,
  ) {
    const user = await prisma.user.findFirst({
      where: {
        billingCustomerId: event.data.object.customer as string,
      },
    });

    if (!user) {
      throw new AppError({
        description: 'User not found',
        httpCode: HttpCode.BAD_REQUEST,
      });
    }

    if (event.data.object.status !== 'active') {
      logger.info('Subscription status is not active, ignoring this webhook.', {
        status: event.data.object.status,
      });
      return;
    }

    const subscriptionEnd = new Date(0);
    subscriptionEnd.setUTCSeconds(event.data.object.current_period_end);

    const plan = getPlanForProductId(
      event.data.object.items.data[0].price.product as string,
    );

    if (user.plan === BillingPlan.FREE || user.plan === BillingPlan.TRIAL) {
      track(AppEvent.NewSubscription, user.id, undefined, {
        amount: event.data.object.items.data[0].price.unit_amount,
      });

      const subscriptionAmount =
        (event.data.object.items.data[0].price.unit_amount || 0) / 100;
      await postToDiscordBillingChannel(
        `New subscription: ${user.email}! Amount: $${subscriptionAmount}.`,
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        subscriptionPaidThrough: subscriptionEnd,
        plan,
      },
    });

    await setIntercomCustomAttributes(user.id, {
      'Plan Renewal Date': subscriptionEnd,
      Plan: plan,
    });
  }

  private async processInvoicePaidEvent(
    event: Stripe.InvoicePaidEvent,
    logger: MythWeaverLogger,
  ) {
    if (event.data.object.status === 'paid') {
      const lines = event.data.object.lines.data;
      const subscriptionLines = lines.filter((l) => l.subscription !== null);

      if (subscriptionLines.length) {
        const prevSubscription = subscriptionLines.find((sl) => sl.amount < 0);
        const curSubscription = subscriptionLines.find((sl) => sl.amount > 0);

        const subscriptionProductId = curSubscription?.plan?.product as string;
        const itemProductId = curSubscription?.price?.product as string;

        if (subscriptionProductId) {
          logger.info('Processing invoice paid event for subscription', {
            customerId: event.data.object.customer as string,
            subscriptionProductId,
          });

          const user = await getUser(event.data.object.customer as string);
          if (
            event.data.object.discount?.coupon.id ===
            user.preorderRedemptionCoupon
          ) {
            logger.info('Beginning to process preorder redemption...');

            const subscription = await getSubscription(
              event.data.object.subscription as string,
            );
            const subscriptionEnd = new Date(0);
            subscriptionEnd.setUTCSeconds(subscription.current_period_end);

            const plan = getPlanForProductId(
              curSubscription?.plan?.product as string,
            );

            await prisma.user.update({
              where: {
                id: user.id,
              },
              data: {
                preorderRedemptionCoupon: null,
                preorderRedemptionStripePriceId: null,
                trialEndsAt: null,
                plan,
                subscriptionPaidThrough: subscriptionEnd,
              },
            });

            track(AppEvent.PreorderSubscriptionRedemption, user.id);
            logger.info('Preorder redemption completed');
          } else {
            await processSubscriptionPaid(
              event.data.object.customer as string,
              subscriptionProductId,
              curSubscription?.plan as Stripe.Plan,
              event.data.object.amount_paid / 100,
              logger,
              (prevSubscription?.plan?.product as string) ?? null,
              (prevSubscription?.plan as Stripe.Plan) ?? null,
            );
          }
        } else {
          logger.info(
            'Ignoring invoice paid event for item, this is handled in session.checkout.completed',
            {
              customerId: event.data.object.customer as string,
              itemProductId,
            },
          );
        }
      }
    }
  }
}

const processItemPaid = async (
  billingCustomerId: string,
  productId: string,
  amountPaid: number,
  qty: number,
  logger: MythWeaverLogger,
) => {
  const user = await getUser(billingCustomerId);
  const creditCount = getImageCreditCountForProductId(productId);

  logger.info('Incrementing image credits for user', { creditCount });
  await modifyImageCreditCount(
    user.id,
    creditCount * qty,
    ImageCreditChangeType.PURCHASE,
    `Purchased ${qty} of ${creditCount} image credit packs`,
  );

  track(AppEvent.PaidImageCreditPack, user.id, undefined, {
    amount: amountPaid,
    quantity: creditCount,
  });

  track(AppEvent.RevenueReceived, user.id, undefined, {
    amount: amountPaid,
  });
};

const processSubscriptionPaid = async (
  billingCustomerId: string,
  productId: string,
  stripePlan: Stripe.Plan,
  amountPaid: number,
  logger: MythWeaverLogger,
  prevProductId: string,
  prevStripePlan: Stripe.Plan,
) => {
  const user = await getUser(billingCustomerId);
  const plan = getPlanForProductId(productId);
  let prevPlan = null;
  if (prevProductId) {
    prevPlan = getPlanForProductId(prevProductId);
  }
  const interval = getBillingIntervalForStripePlan(stripePlan);
  const prevInterval = prevStripePlan
    ? getBillingIntervalForStripePlan(prevStripePlan)
    : null;

  let curCreditCount =
    plan === BillingPlan.PRO
      ? PRO_PLAN_IMAGE_CREDITS
      : BASIC_PLAN_IMAGE_CREDITS;

  let prevCreditCount = 0;
  if (prevPlan && amountPaid > 0) {
    prevCreditCount =
      prevPlan === BillingPlan.PRO
        ? PRO_PLAN_IMAGE_CREDITS
        : BASIC_PLAN_IMAGE_CREDITS;
  }

  if (interval === BillingInterval.YEARLY) {
    curCreditCount = curCreditCount * 12;
  }
  if (prevInterval && prevInterval === BillingInterval.YEARLY) {
    prevCreditCount = prevCreditCount * 12;
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      planInterval: interval,
      trialEndsAt: null,
    },
  });

  logger.info('Incrementing image credits for user', { curCreditCount });
  await modifyImageCreditCount(
    user.id,
    amountPaid > 0 ? curCreditCount - prevCreditCount : 0,
    ImageCreditChangeType.SUBSCRIPTION,
    `${plan} plan`,
  );

  await setIntercomCustomAttributes(user.id, {
    'Plan Interval': interval,
    Plan: plan,
  });

  track(AppEvent.PaidSubscription, user.id, undefined, {
    amount: amountPaid,
  });

  track(AppEvent.RevenueReceived, user.id, undefined, {
    amount: amountPaid,
  });
};

const getUser = async (billingCustomerId: string): Promise<User> => {
  const user = await prisma.user.findFirst({
    where: {
      billingCustomerId,
    },
  });

  if (!user) {
    throw new AppError({
      description: 'User not found',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  return user;
};

const getBillingIntervalForStripePlan = (
  plan: Stripe.Plan,
): BillingInterval => {
  return plan.interval === 'month'
    ? BillingInterval.MONTHLY
    : BillingInterval.YEARLY;
};
