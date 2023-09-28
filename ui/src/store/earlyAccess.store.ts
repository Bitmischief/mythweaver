import { defineStore } from 'pinia';

interface EarlyAccessStoreState {
  confirmed: boolean;
}

const EARLY_ACCESS_CONFIRMATION_KEY_NAME = 'early-access-confirmation';

export const useEarlyAccessStore = defineStore({
  id: 'earlyAccess',
  state: (): EarlyAccessStoreState => ({
    confirmed: localStorage.getItem(EARLY_ACCESS_CONFIRMATION_KEY_NAME)
      ? (localStorage.getItem(EARLY_ACCESS_CONFIRMATION_KEY_NAME)?.length || 0) > 0
      : false,
  }),
  actions: {
    confirm() {
      localStorage.setItem(EARLY_ACCESS_CONFIRMATION_KEY_NAME, 'true');
      this.confirmed = true;
    },
  },
});
