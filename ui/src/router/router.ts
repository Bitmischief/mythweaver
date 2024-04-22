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
import CharactersList from '@/views/CharactersList.vue';
import CharactersView from '@/views/CharactersView.vue';
import CharactersNew from '@/components/Characters/NewCharacter.vue';
import AuthenticatedView from '@/views/AuthenticatedView.vue';
import AccountView from '@/views/AccountView.vue';
import OverviewCampaign from '@/components/Campaigns/OverviewCampaign.vue';
import MagicLinkConjuration from '@/components/Conjuration/MagicLinkConjuration.vue';

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
      children: [
        {
          name: 'CONJURE',
          path: 'conjure',
          component: MagicLinkConjuration,
        },
      ],
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
          path: '/characters',
          component: CharactersList,
          meta: {
            authRequired: true,
          },
        },
        {
          path: '/character/new',
          component: CharactersNew,
          meta: {
            authRequired: true,
          },
        },
        {
          name: 'CHARACTER',
          path: '/character/:characterId',
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
              meta: {
                paidRequired: true,
              },
            },
            {
              path: 'view/:conjurationId',
              component: ViewConjuration,
              meta: {
                paidRequired: true,
              },
            },
            {
              path: 'new',
              component: ListConjurers,
              meta: {
                paidRequired: true,
              },
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
