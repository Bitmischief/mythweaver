import axios from 'axios';

export const getCheckoutUrl = (priceId: string, subscription: boolean) => {
  return axios.post('/billing/checkout-url', {
    priceId,
    subscription,
  });
};

export const getBillingPortalUrl = () => {
  return axios.get('/billing/portal-url');
};
