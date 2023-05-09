import {createRouter, createWebHistory} from "vue-router";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import {useAuthStore} from "@/store";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'LOGIN',
      path: '/login',
      component: LoginView,
    },
    {
      name: 'HOME',
      path: '/',
      component: HomeView,
      meta: {
        authRequired: true,
      }
    }
  ],
});

router.beforeEach(async (to) => {
  const authRequired = to?.meta?.authRequired || false;
  const auth = useAuthStore();

  if (authRequired && !auth.tokens) {
    auth.returnUrl = to.fullPath;
    return '/login';
  }
});

export default router;
