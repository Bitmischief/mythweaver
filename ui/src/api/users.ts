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
  earlyAccessExempt: boolean;
  plan: BillingPlan;
  subscriptionPaidThrough: string;
  imageCredits: number;
  preorderRedemptionCoupon: string;
  conjurationCount: number;
}

export const getCurrentUser = () => {
  return axios.get('/users/me');
};

export const patchCurrentUser = (payload: any) => {
  return axios.patch('/users/me', payload);
};
