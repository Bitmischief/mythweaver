import { urlPrefix } from '../lib/utils';
import { AppError, HttpCode } from '../lib/errors/AppError';
import Stripe from 'stripe';
import { BillingPlan } from '@prisma/client';
import logger from '../lib/logger';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY as string);

export const createCustomer = async (email: string): Promise<string> => {
  const existingCustomerSearch = await stripe.customers.search({
    query: `email:'${email}'`,
  });

  if (existingCustomerSearch.data.length > 0) {
    return existingCustomerSearch.data[0].id;
  }

  logger.info('Creating stripe customer for', { email });
  const customer = await stripe.customers.create({
    email,
  });

  return customer.id;
};

export const getSubscriptionForCustomer = async (customerId: string) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data[0];
};

export const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

export const getCheckoutUrl = async (
  customerId: string,
  priceId: string,
  subscription: boolean,
) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    success_url: `${urlPrefix}/account-settings`,
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

  return session.url;
};

export const getSessionLineItems = async (sessionId: string) => {
  const { line_items } = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });

  return line_items;
};

export interface GetBillingPortalUrlRequest {
  upgrade?: boolean;
  newPlanPriceId?: string;
  redirectUri?: string;
}

export const getBillingPortalUrl = async (
  customerId: string,
  request: GetBillingPortalUrlRequest,
): Promise<string> => {
  logger.info('Getting billing portal url for stripe customer id', customerId);

  let subscription: Stripe.Subscription | undefined = undefined;

  if (request.upgrade) {
    const subscriptions = await stripe.subscriptions.list({
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

  const session = await stripe.billingPortal.sessions.create({
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
};

export const validateEvent = async (payload: any, signature: string) => {
  let event: Stripe.Event;
  const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    throw new AppError({
      description: `Webhook Error: ${err.message}`,
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
    });
  }

  return event;
};

export const getImageCreditCountForProductId = (productId: string) => {
  if (productId === process.env.STRIPE_IMAGE_PACK_100_PRODUCT_ID) {
    return 100;
  }

  throw new AppError({
    description: 'Unknown product id',
    httpCode: HttpCode.BAD_REQUEST,
  });
};

export const getPlanForProductId = (productId: string) => {
  if (productId === process.env.STRIPE_BASIC_PLAN_ID) {
    return BillingPlan.BASIC;
  } else if (productId === process.env.STRIPE_PRO_PLAN_ID) {
    return BillingPlan.PRO;
  } else return BillingPlan.FREE;
};

export const getPreorderRedemptionSessionUrl = async (
  customerId: string,
  priceId: string,
  coupon: string,
) => {
  const session = await stripe.checkout.sessions.create({
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

  return session.url;
};
