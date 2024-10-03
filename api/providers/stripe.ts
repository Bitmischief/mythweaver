import { urlPrefix } from '../lib/utils';
import { AppError, HttpCode } from '../lib/errors/AppError';
import Stripe from 'stripe';
import { BillingPlan, BillingInterval } from '@prisma/client';
import logger from '../lib/logger';
import { GetBillingPortalUrlRequest } from '../modules/billing/billing.interface';

export class StripeProvider {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2023-10-16',
    });
  }

  async createCustomer(email: string): Promise<string> {
    const existingCustomerSearch = await this.stripe.customers.search({
      query: `email:'${email}'`,
    });

    if (existingCustomerSearch.data.length > 0) {
      return existingCustomerSearch.data[0].id;
    }

    logger.info('Creating stripe customer for', { email });
    const customer = await this.stripe.customers.create({
      email,
    });

    return customer.id;
  }

  async getSubscriptionForCustomer(customerId: string) {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    return subscriptions.data[0];
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async getCheckoutUrl(
    customerId: string,
    priceId: string,
    subscription: boolean,
  ): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      success_url: `${urlPrefix}/subscribed`,
      cancel_url: `${urlPrefix}/account-settings`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      mode: subscription ? 'subscription' : 'payment',
      automatic_tax: {
        enabled: true,
      },
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    if (!session.url) {
      throw new AppError({
        description: 'Failed to generate checkout url!',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    return session.url;
  }

  async getSessionLineItems(sessionId: string) {
    const { line_items } = await this.stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ['line_items'],
      },
    );

    return line_items;
  }

  async getBillingPortalUrl(
    customerId: string,
    request: GetBillingPortalUrlRequest,
  ): Promise<string> {
    logger.info(
      'Getting billing portal url for stripe customer id',
      customerId,
    );

    let subscription: Stripe.Subscription | undefined = undefined;

    if (request.upgrade) {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      });

      subscription = subscriptions?.data[0];

      if (!subscription) {
        throw new AppError({
          description: 'No subscriptions found for customer',
          httpCode: HttpCode.BAD_REQUEST,
        });
      }
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${urlPrefix}/account-settings`,
      flow_data:
        request.upgrade && subscription
          ? {
              type: 'subscription_update_confirm',
              subscription_update_confirm: {
                items: [
                  {
                    id: subscription.items.data[0].id,
                    price: request.newPlanPriceId,
                    quantity: 1,
                  },
                ],
                subscription: subscription.id,
              },
              after_completion: request.redirectUri
                ? {
                    type: 'redirect',
                    redirect: {
                      return_url: request.redirectUri,
                    },
                  }
                : undefined,
            }
          : undefined,
    });

    logger.info('Received billing portal url', session.url);
    return session.url;
  }

  async validateEvent(payload: any, signature: string) {
    let event: Stripe.Event;
    const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

    try {
      if (!endpointSecret) {
        throw new AppError({
          description: 'Missing Stripe endpoint secret!',
          httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
      }

      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err: any) {
      throw new AppError({
        description: `Webhook Error: ${err.message}`,
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    return event;
  }

  getImageCreditCountForProductId(productId: string): number {
    if (productId === process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID) {
      return 100;
    }

    logger.error('Unknown product id', {
      productId: process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID,
    });

    throw new AppError({
      description: 'Unknown product id',
      httpCode: HttpCode.BAD_REQUEST,
    });
  }

  getPlanForProductId(productId: string): BillingPlan {
    if (productId === process.env.STRIPE_BASIC_PLAN_ID) {
      return BillingPlan.BASIC;
    } else if (productId === process.env.STRIPE_PRO_PLAN_ID) {
      return BillingPlan.PRO;
    } else return BillingPlan.FREE;
  }

  getBillingIntervalForStripePlan(plan: Stripe.Plan): BillingInterval {
    return plan.interval === 'month'
      ? BillingInterval.MONTHLY
      : BillingInterval.YEARLY;
  }

  getCreditCountForPlan(plan: BillingPlan, interval: BillingInterval): number {
    let creditCount = plan === BillingPlan.PRO ? 300 : 100;
    if (interval === BillingInterval.YEARLY) {
      creditCount *= 12;
    }
    return creditCount;
  }

  async getPreorderRedemptionSessionUrl(
    customerId: string,
    priceId: string,
    coupon: string,
  ): Promise<string> {
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      success_url: `${urlPrefix}/account-settings`,
      cancel_url: `${urlPrefix}/account-settings`,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts: [
        {
          coupon,
        },
      ],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    if (!session.url) {
      throw new AppError({
        description: 'Failed to generate checkout url!',
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      });
    }

    return session.url;
  }
}

export default new StripeProvider();
