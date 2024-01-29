import { Body, Get, Inject, Post, Route, SuccessResponse, Tags } from 'tsoa';
import { prisma } from '../lib/providers/prisma';
import { AppError, HttpCode } from '../lib/errors/AppError';
import { parentLogger } from '../lib/logger';
import { AppEvent, track, TrackingInfo } from '../lib/tracking';
import {
  getBillingPortalUrl,
  getCheckoutUrl,
  getPlanForProductId,
} from '../services/billing';
import Stripe from 'stripe';
import { BillingPlan } from '@prisma/client';
const logger = parentLogger.getSubLogger();

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
    @Body() body: { planId: string },
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

    return await getCheckoutUrl(user.billingCustomerId || '', body.planId);
  }

  @Get('/portal-url')
  @SuccessResponse('200', 'Success')
  public async getPortalUrl(
    @Inject() userId: number,
    @Inject() trackingInfo: TrackingInfo,
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

    return await getBillingPortalUrl(user.billingCustomerId || '');
  }

  public async processWebhook(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      await this.processCheckoutSessionCompletedEvent(event);
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
      await this.processInvoicePaidEvent(event);
    }
  }

  private async processCheckoutSessionCompletedEvent(
    event: Stripe.CheckoutSessionCompletedEvent,
  ) {
    logger.info('Checkout session completed', event);

    const user = await prisma.user.findUnique({
      where: {
        email: event.data.object.customer_details?.email || '',
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
        billingCustomerId: event.data.object.customer as string,
      },
    });
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

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        subscriptionPaidThrough: new Date(event.data.object.current_period_end),
      },
    });

    // @TODO: Send email to user
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

    // @TODO: email user
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

    const subscriptionEnd = new Date(0);
    subscriptionEnd.setUTCSeconds(event.data.object.current_period_end);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        subscriptionPaidThrough: subscriptionEnd,
        plan: getPlanForProductId(
          event.data.object.items.data[0].price.product as string,
        ),
      },
    });

    // @TODO: email user
  }

  private async processInvoicePaidEvent(event: Stripe.InvoicePaidEvent) {
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

    if (event.data.object.status === 'paid') {
      const productId = event.data.object.lines.data[0].plan?.product as string;

      if (!productId) {
        throw new AppError({
          description: 'Product not found',
          httpCode: HttpCode.BAD_REQUEST,
        });
      }

      const plan = getPlanForProductId(productId);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          imageCredits:
            user.imageCredits +
            (plan === BillingPlan.PRO
              ? PRO_PLAN_IMAGE_CREDITS
              : BASIC_PLAN_IMAGE_CREDITS),
        },
      });

      track(AppEvent.PaidSubscription, user.id, undefined, {
        amount: event.data.object.amount_paid,
      });
    }

    // @TODO: email user
  }
}
