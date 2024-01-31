import axios from 'axios';

export const getCheckoutUrl = (planId: string) => {
  return axios.post('/billing/checkout-url', {
    planId,
  });
};

export const getBillingPortalUrl = () => {
  return axios.get('/billing/portal-url');
};
