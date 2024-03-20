import { defineStore } from 'pinia';
import { postToken, postRefresh } from '@/api/auth.ts';
import router from '@/router/router.ts';
import { showError } from '@/lib/notifications.ts';
import { getCurrentUser, User } from '@/api/users.ts';
import { useEventBus } from '@/lib/events.ts';
import { useLDClient } from 'launchdarkly-vue-client-sdk';

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

        if (
          this.user &&
          !this.user.plan &&
          !this.user.earlyAccessExempt &&
          this.user.earlyAccessCutoffAt &&
          Date.parse(this.user?.earlyAccessCutoffAt) < Date.now()
        ) {
          await router.push('/auth/earlyaccess');
        }

        if (this.user) {
          const ldClient = useLDClient();
          await ldClient.identify({
            key: this.user.id.toString(),
            email: this.user.email,
            name: this.user.username,
            custom: {
              plan: this.user.plan,
            },
          });
        }

        const eventBus = useEventBus();
        eventBus.$emit('user-loaded', this.user);
      } catch (err) {
        showError({ message: 'Unable to load user, please try again soon.' });
      } finally {
        this.isLoading = false;
      }
    },
    async login(
      type: 'MAGIC_LINK',
      credential: string,
      inviteCode: string | undefined = undefined,
    ): Promise<boolean> {
      try {
        await this.clearCache();

        const response = await postToken(type, credential, inviteCode);

        this.tokens = response.data;

        // store user details and jwt in local storage to keep user logged in between page refreshes
        localStorage.setItem(TOKENS_KEY_NAME, JSON.stringify(this.tokens));

        await this.loadCurrentUser();

        if (response.data.signupConjurationPrompt) {
          await router.push(`/magic-link/conjure?t=${credential}`);
        } else {
          // redirect to previous url or default to home page
          await router.push(this.returnUrl || '/');
        }
        return true;
      } catch (err: any) {
        if (err.response.status === 403) {
          showError({ message: 'Your user is not authorized for early access!' });
          await router.push('/earlyaccess');
          return false;
        }
        if (err.response.status === 401) {
          showError({
            message:
              "Your magic link has expired! Enter your email again and we'll send you a new one!",
          });
          await router.push('/login');
          return false;
        } else {
          showError({ message: 'Unable to login, please try again soon.' });
          return true;
        }
      }
    },
    async refresh() {
      try {
        const response = await postRefresh(this.tokens?.refresh_token);

        this.tokens = response.data;

        // store user details and jwt in local storage to keep user logged in between page refreshes
        localStorage.setItem(TOKENS_KEY_NAME, JSON.stringify(this.tokens));

        await this.loadCurrentUser();
      } catch (err) {
        console.error(err);
      }
    },
    async logout() {
      this.tokens = null;
      await this.clearCache();
      await router.push('/login');
    },
    async clearCache() {
      localStorage.clear();
      this.tokens = null;
      this.user = null;
    },
  },
});
