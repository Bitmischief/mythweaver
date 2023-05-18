import {createRouter, createWebHistory} from "vue-router";
import CharactersView from "@/views/CharactersView.vue";
import LoginView from "@/views/LoginView.vue";
import {useAuthStore} from "@/store";
import ViewCharacter from "@/components/Characters/ViewCharacter.vue";
import ListCharacters from "@/components/Characters/ListCharacters.vue";

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
      redirect: '/characters',
    },
    {
      name: 'CHARACTERS',
      path: '/characters',
      component: CharactersView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: 'list',
          alias: '',
          component: ListCharacters,
        },
        {
          path: ':characterId',
          component: ViewCharacter,
        },
      ]
    },
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
