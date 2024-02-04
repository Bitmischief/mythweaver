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
import ListConjurations from '@/components/Conjuration/ListConjurations.vue';
import ViewConjuration from '@/components/Conjuration/ViewConjuration.vue';
import InviteView from '@/views/InviteView.vue';
import MagicLink from '@/components/Auth/MagicLink.vue';
import PreAuthView from '@/views/PreAuthView.vue';
import EarlyAccessView from '@/views/EarlyAccessView.vue';
import CharactersView from '@/views/CharactersView.vue';
import ViewSessionPlanning from '@/components/Sessions/ViewSessionPlanning.vue';
import ViewSessionSummary from '@/components/Sessions/ViewSessionSummary.vue';
import ViewSessionRecap from '@/components/Sessions/ViewSessionRecap.vue';
import AuthenticatedView from '@/views/AuthenticatedView.vue';
import AccountView from '@/views/AccountView.vue';
import OverviewCampaign from '@/components/Campaigns/OverviewCampaign.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      redirect: '/auth/login',
    },
    {
      path: '/preauth',
      redirect: '/auth/preauth',
    },
    {
      path: '/earlyaccess',
      redirect: '/auth/earlyaccess',
    },
    {
      path: '/magic-link',
      redirect: '/auth/magic-link',
    },
    {
      path: '/invite',
      redirect: '/auth/invite',
    },
    {
      name: 'AUTH',
      path: '/auth',
      children: [
        {
          name: 'LOGIN',
          path: 'login',
          component: LoginView,
        },
        {
          name: 'PREAUTH',
          path: 'preauth',
          component: PreAuthView,
        },
        {
          name: 'EARLY_ACCESS',
          path: 'earlyaccess',
          component: EarlyAccessView,
        },
        {
          name: 'MAGIC_LINK',
          path: 'magic-link',
          component: MagicLink,
        },
        {
          name: 'INVITE',
          path: 'invite',
          component: InviteView,
        },
      ],
    },
    {
      name: 'HOME',
      path: '/',
      redirect: '/conjurations',
      meta: {
        authRequired: true,
      },
      component: AuthenticatedView,
      children: [
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
            {
              path: 'overview',
              component: OverviewCampaign,
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
              path: ':sessionId',
              component: ViewSession,
              children: [
                {
                  path: 'planning',
                  component: ViewSessionPlanning,
                },
                {
                  path: 'recap',
                  component: ViewSessionRecap,
                },
                {
                  path: 'summary',
                  component: ViewSessionSummary,
                },
              ],
            },
          ],
        },
        {
          name: 'ACCOUNT',
          path: '/account-settings',
          component: AccountView,
          meta: {
            authRequired: true,
          },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
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
