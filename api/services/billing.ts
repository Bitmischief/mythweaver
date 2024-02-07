// Set your secret key. Remember to switch to your live secret key in production.
// See your keys here: https://dashboard.stripe.com/apikeys
import { urlPrefix } from '../lib/utils';
import { AppError, HttpCode } from '../lib/errors/AppError';
import Stripe from 'stripe';
import { BillingPlan } from '@prisma/client';
import logger from '../lib/logger';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY as string);

export const createCustomer = async (email: string): Promise<string> => {
  logger.info('Creating stripe customer for', email);
  const customer = await stripe.customers.create({
    email,
  });

  return customer.id;
};

export const getCheckoutUrl = async (customerId: string, planId: string) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    success_url: `${urlPrefix}/account-settings`,
    line_items: [
      {
        price: planId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
  });

  return session.url;
};

export const getBillingPortalUrl = async (
  customerId: string,
): Promise<string> => {
  logger.info('Getting billing portal url for stripe customer id', customerId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${urlPrefix}/account-settings`,
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

export const getPlanForProductId = (productId: string) => {
  if (productId === process.env.STRIPE_BASIC_PLAN_ID) {
    return BillingPlan.BASIC;
  } else if (productId === process.env.STRIPE_PRO_PLAN_ID) {
    return BillingPlan.PRO;
  } else return BillingPlan.FREE;
};
