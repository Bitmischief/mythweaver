import { defineStore } from 'pinia';
import { postToken, postRefresh } from '@/api/auth.ts';
import router from '@/router/router.ts';
import { showError } from '@/lib/notifications.ts';
import { getCurrentUser, User } from '@/api/users.ts';
import { datadogLogs } from '@datadog/browser-logs';

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
      } catch (err) {
        showError({ message: 'Unable to load user, please try again soon.' });
      } finally {
        this.isLoading = false;
      }
    },
    async login(
      type: 'GOOGLE' | 'MAGIC_LINK',
      credential: string,
      inviteCode: string | undefined = undefined,
    ): Promise<boolean> {
      try {
        const response = await postToken(type, credential, inviteCode);

        this.tokens = response.data;

        // store user details and jwt in local storage to keep user logged in between page refreshes
        localStorage.setItem(TOKENS_KEY_NAME, JSON.stringify(this.tokens));

        await this.loadCurrentUser();

        // redirect to previous url or default to home page
        await router.push(this.returnUrl || '/');
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
          datadogLogs.logger.error('Unable to log in', { err });
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
      localStorage.removeItem(TOKENS_KEY_NAME);
      await router.push('/login');
    },
  },
});
