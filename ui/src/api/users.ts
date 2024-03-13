import axios from 'axios';

export enum BillingPlan {
  Free = 'FREE',
  Basic = 'BASIC',
  Pro = 'PRO',
}

export interface User {
  id: number;
  email: string;
  username: string;
  createdAt: string;
  earlyAccessCutoffAt: string;
  earlyAccessExempt: boolean;
  plan: BillingPlan;
  subscriptionPaidThrough: string;
  imageCredits: number;
}

export const getCurrentUser = () => {
  return axios.get('/users/me');
};

export const patchCurrentUser = (payload: any) => {
  return axios.patch('/users/me', payload);
};
