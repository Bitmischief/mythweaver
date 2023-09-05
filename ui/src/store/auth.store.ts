import { defineStore } from "pinia";
import { postToken, postRefresh } from "@/api/auth.ts";
import router from "@/router/router.ts";
import { showError } from "@/lib/notifications.ts";
import { getCurrentUser, User } from "@/api/users.ts";

interface AuthStoreState {
  tokens: any;
  returnUrl: string | null;
  user: User | null;
  isLoading: boolean;
}

const TOKENS_KEY_NAME = "tokens";

export const useAuthStore = defineStore({
  id: "auth",
  state: (): AuthStoreState => ({
    // initialize state from local storage to enable user to stay logged in
    tokens: localStorage.getItem(TOKENS_KEY_NAME)
      ? JSON.parse(localStorage.getItem(TOKENS_KEY_NAME) || "")
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
        await this.logout();
      } finally {
        this.isLoading = false;
      }
    },
    async login(credential: string): Promise<boolean> {
      try {
        const response = await postToken(credential);

        this.tokens = response.data;

        // store user details and jwt in local storage to keep user logged in between page refreshes
        localStorage.setItem(TOKENS_KEY_NAME, JSON.stringify(this.tokens));

        await this.loadCurrentUser();

        // redirect to previous url or default to home page
        await router.push(this.returnUrl || "/");
        return true;
      } catch (err: any) {
        if (err.response.status === 400) {
          showError({ message: "Your user is not authorized for early access!" });
          return false;
        } else {
          showError({ message: "Unable to login, please try again soon." });
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
      await router.push("/login");
    },
  },
});
