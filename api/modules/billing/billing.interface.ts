import { BillingPlan, BillingInterval } from '@prisma/client';
import Stripe from 'stripe';

export interface CheckoutUrlRequest {
  priceId: string;
  subscription: boolean;
}

export interface GetBillingPortalUrlRequest {
  upgrade?: boolean;
  newPlanPriceId?: string;
  redirectUri?: string;
}

export interface BillingPortalUrlRequest {
  upgrade?: boolean;
  newPlanPriceId?: string;
  redirectUri?: string;
}

export interface SubscriptionInfo {
  isPreOrder: boolean;
  preOrderValidUntil: number;
  isLifetimePreOrder: boolean;
  subscriptionRenewalDate: number;
}

export interface BillingPlanInfo {
  plan: BillingPlan;
  interval: BillingInterval;
  creditCount: number;
}

export interface ProcessItemPaidParams {
  billingCustomerId: string;
  productId: string;
  amountPaid: number;
  quantity: number;
}

export interface ProcessSubscriptionPaidParams {
  user: {
    id: number;
    email: string;
    createdAt: Date;
    initialTrackingData?: any;
  };
  productId: string;
  stripePlan: Stripe.Plan;
  amountPaid: number;
  prevProductId: string | null;
  prevStripePlan: Stripe.Plan | null;
  coupon?: Stripe.Coupon;
}

export interface HandleSubscriptionChangeParams {
  user: {
    id: number;
    email: string;
    plan: BillingPlan;
    createdAt: Date;
    initialTrackingData?: any;
  };
  newPlan: BillingPlan;
  subscriptionEnd: Date;
  subscriptionAmount: number;
  daysSinceRegistration: number;
}

export interface ProcessPreorderRedemptionParams {
  user: {
    id: number;
    email: string;
  };
  subscriptionId: string;
  productId: string;
}

export interface SendNewSubscriptionNotificationsParams {
  user: {
    email: string;
    initialTrackingData?: any;
  };
  subscriptionAmount: number;
  daysSinceRegistration: number;
}

export interface SendSubscriberWelcomeEmailParams {
  email: string;
  plan: BillingPlan;
  campaignName?: string;
}
