import axios from 'axios';

export enum BillingPlan {
  Trial = 'TRIAL',
  Free = 'FREE',
  Basic = 'BASIC',
  Pro = 'PRO',
}

export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
  trialEndsAt: string;
  plan: BillingPlan;
  subscriptionPaidThrough: string;
  imageCredits: number;
  preorderRedemptionCoupon: string;
  conjurationCount: number;
  initialTrackingData: any;
  amountSupportingArtistsUsd: number;
  onboarded: boolean;
  discordHandle: string;
  pendingPlanChange: BillingPlan | undefined;
  pendingPlanChangeEffectiveDate: Date | undefined;
}

export interface Subscription {
  isPreOrder: boolean;
  preOrderValidUntil: number;
  isLifetimePreOrder: boolean;
  subscriptionRenewalDate: number;
}

export const getCurrentUser = () => {
  return axios.get('/users/me');
};

export const patchCurrentUser = (payload: any) => {
  return axios.patch('/users/me', payload);
};

export const getCurrentSubscription = () => {
  return axios.get('/users/me/subscription');
};
