import { defineStore } from 'pinia';
import { BillingPlan, getCurrentUser, User } from '@/api/users.ts';
import { useEventBus } from '@/lib/events.ts';
import router from '@/router/router';

interface AuthStoreState {
  tokens: {
    accessToken?: string;
    refreshToken?: string;
  } | null;
  returnUrl: string | null;
  user: User | null;
  isLoading: boolean;
}

const TOKENS_KEY_NAME = 'tokens';

export const useAuthStore = defineStore({
  id: 'auth',
  state: (): AuthStoreState => ({
    tokens: localStorage.getItem(TOKENS_KEY_NAME)
      ? JSON.parse(localStorage.getItem(TOKENS_KEY_NAME) || '')
      : null,
    returnUrl: null,
    user: null,
    isLoading: false,
  }),
  actions: {
    updateTokens(accessToken: string, refreshToken: string) {
      this.tokens = { accessToken, refreshToken };
      localStorage.setItem(TOKENS_KEY_NAME, JSON.stringify(this.tokens));
    },
    async loadCurrentUser(): Promise<void> {
      this.isLoading = true;

      try {
        const userResponse = await getCurrentUser();
        this.user = userResponse.data as User | null;

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
      localStorage.removeItem(TOKENS_KEY_NAME);
      this.tokens = null;
      this.user = null;
    },
  },
});
