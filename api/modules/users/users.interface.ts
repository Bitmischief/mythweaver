export interface PatchUserRequest {
  campaignId?: number;
  name?: string;
  username?: string;
  imageUri?: string;
  data?: any;
  tags?: string[];
  confirmEarlyAccessStart?: boolean;
  initialTrackingData?: any;
  onboarded?: boolean;
}

export interface AddUserCreditsRequest {
  email: string;
  amount: number;
}

export interface GetUserResponse {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  email: string;

  trialEndsAt?: Date;
  billingCustomerId?: string;
  subscriptionPaidThrough?: Date;
  plan: string;
  planInterval: string;
  username: string;
  imageCredits: number;
  lifetimeAccess: boolean;
  preorderRedemptionCoupon: string;
  preorderRedemptionStripePriceId: string;

  conjurationCount: number;
}

export interface GetSubscriptionResponse {
  isPreOrder: boolean;
  preOrderValidUntil?: Date;
  isLifetimePreOrder: boolean | null;
  subscriptionRenewalDate?: Date;
}
