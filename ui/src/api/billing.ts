import axios from 'axios';

export const getCheckoutUrl = (priceId: string, subscription: boolean) => {
  return axios.post('/billing/checkout-url', {
    priceId,
    subscription,
  });
};

export interface BillingPortalUrlRequest {
  upgrade?: boolean;
  newPlanPriceId?: string;
  redirectUri?: string;
}

export const getBillingPortalUrl = (request?: BillingPortalUrlRequest) => {
  return axios.get('/billing/portal-url', {
    params: request,
  });
};
