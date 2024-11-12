import { defineStore } from 'pinia';
import { BillingPlan, getCurrentUser, User } from '@/api/users.ts';
import { useEventBus } from '@/lib/events.ts';
import router from '@/router/router';

interface AuthStoreState {
  tokens: any;
  returnUrl: string | null;
  user: User | null;
  isLoading: boolean;
}

const TOKENS_KEY_NAME = 'tokens';

export const useAuthStore = defineStore({
  id: 'auth',
  state: (): AuthStoreState => ({
    // initialize state from local storage to enable user to stay logged in
    tokens: localStorage.getItem(TOKENS_KEY_NAME)
      ? JSON.parse(localStorage.getItem(TOKENS_KEY_NAME) || '')
      : null,
    returnUrl: null,
    user: null,
    isLoading: false,
  }),
  actions: {
    async loadCurrentUser(): Promise<void> {
      this.isLoading = true;

      try {
        const userResponse = await getCurrentUser();
        this.user = userResponse.data;

        if (!this.user) {
          return;
        }

        if (!this.user.plan) {
          this.user.plan = BillingPlan.Free;
        }

        const eventBus = useEventBus();
        eventBus.$emit('user-loaded', this.user);
      } catch (err) {
        console.log('Unable to load user');
        await this.logout();
        router.push('/login');
      } finally {
        this.isLoading = false;
      }
    },
    async logout() {
      this.tokens = null;
      await this.clearCache();
    },
    async clearCache() {
      localStorage.clear();
      this.tokens = null;
      this.user = null;
    },
  },
});
