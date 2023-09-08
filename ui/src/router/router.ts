import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store';
import LoginView from '@/views/LoginView.vue';
import CampaignsView from '@/views/CampaignsView.vue';
import ListCampaigns from '@/components/Campaigns/ListCampaigns.vue';
import NewCampaign from '@/components/Campaigns/NewCampaign.vue';
import ConjuringView from '@/views/ConjuringView.vue';
import ListConjurers from '@/components/Conjuration/ListConjurers.vue';
import ViewConjurer from '@/components/Conjuration/ViewConjurer.vue';
import ViewCampaign from '@/components/Campaigns/ViewCampaign.vue';
import SessionsView from '@/views/SessionsView.vue';
import ViewSession from '@/components/Sessions/ViewSession.vue';
import ListSessions from '@/components/Sessions/ListSessions.vue';
import NewSession from '@/components/Sessions/NewSession.vue';
import ListConjurations from '@/components/Conjuration/ListConjurations.vue';
import ViewConjuration from '@/components/Conjuration/ViewConjuration.vue';
import InviteView from '@/views/InviteView.vue';
import CharactersView from '@/views/CharactersView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'LOGIN',
      path: '/login',
      component: LoginView,
    },
    {
      name: 'INVITE',
      path: '/invite',
      component: InviteView,
    },
    {
      name: 'HOME',
      path: '/',
      redirect: '/conjurations',
      meta: {
        authRequired: true,
      },
    },
    {
      name: 'CHARACTERS',
      path: '/character',
      component: CharactersView,
      meta: {
        authRequired: true,
      },
    },
    {
      name: 'CAMPAIGNS',
      path: '/campaigns',
      component: CampaignsView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: 'list',
          alias: '',
          component: ListCampaigns,
        },
        {
          path: 'new',
          component: NewCampaign,
        },
      ],
    },
    {
      name: 'CONJURING',
      path: '/conjurations',
      component: ConjuringView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: 'list',
          alias: '',
          component: ListConjurations,
        },
        {
          path: 'view/:conjurationId',
          component: ViewConjuration,
        },
        {
          path: 'new',
          component: ListConjurers,
        },
        {
          path: 'conjure/:summonerCode',
          component: ViewConjurer,
        },
      ],
    },
    {
      name: 'CAMPAIGN',
      path: '/campaign',
      component: CampaignsView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: 'edit',
          alias: '',
          component: ViewCampaign,
        },
      ],
    },
    {
      name: 'SESSION',
      path: '/sessions',
      component: SessionsView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: 'list',
          alias: '',
          component: ListSessions,
        },
        {
          path: 'create',
          component: NewSession,
        },
        {
          path: ':sessionId/edit',
          component: ViewSession,
        },
      ],
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
