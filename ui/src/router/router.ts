import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import CampaignsView from '@/views/CampaignsView.vue';
import ListCampaigns from '@/components/Campaigns/ListCampaigns.vue';
import NewCampaign from '@/components/Campaigns/NewCampaign.vue';
import ConjuringView from '@/views/ConjuringView.vue';
import ViewCampaign from '@/components/Campaigns/ViewCampaign.vue';
import SessionsView from '@/views/SessionsView.vue';
import ViewSession from '@/components/Sessions/ViewSession.vue';
import ListSessions from '@/components/Sessions/ListSessions.vue';
import ViewConjuration from '@/components/Conjuration/ViewConjuration.vue';
import InviteView from '@/views/InviteView.vue';
import CharactersList from '@/views/CharactersList.vue';
import AuthenticatedView from '@/views/AuthenticatedView.vue';
import AccountView from '@/views/AccountView.vue';
import OverviewCampaign from '@/components/Campaigns/OverviewCampaign.vue';
import ConjureView from '@/views/ConjureView.vue';
import CollectionsView from '@/views/CollectionsView.vue';
import { authGuard } from '@auth0/auth0-vue';
import { fbq, gtag, rdt } from '@/lib/conversions.ts';
import { isProduction } from '@/lib/util.ts';
import RelationshipGraphView from '@/views/RelationshipGraphView.vue';
import ImageGalleryView from '@/views/ImageGalleryView.vue';

import ConjurationList from '@/modules/conjurations/components/list/conjurationList.vue';

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
      path: '/invite',
      redirect: '/auth/invite',
    },
    {
      path: '/subscribed',
      redirect: '/account-settings',
    },
    {
      path: '/conjurations/new',
      redirect: '/conjure',
    },
    {
      name: 'AUTH',
      path: '/auth',
      children: [
        {
          name: 'LOGIN',
          path: 'login',
          component: LoginView,
          meta: {
            noAuth: true,
          },
        },
        {
          name: 'INVITE',
          path: 'invite',
          component: InviteView,
          meta: {
            noAuth: true,
          },
        },
      ],
    },
    {
      name: 'HOME',
      path: '/',
      redirect: '/conjurations',
      beforeEnter: authGuard,
      component: AuthenticatedView,
      children: [
        {
          name: 'CHARACTERS',
          path: '/characters',
          component: CharactersList,
          beforeEnter: authGuard,
        },
        {
          name: 'CAMPAIGNS',
          path: '/campaigns',
          component: CampaignsView,
          beforeEnter: authGuard,
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
          name: 'CONJURATIONS',
          path: '/conjurations',
          component: ConjuringView,
          beforeEnter: authGuard,
          children: [
            {
              path: 'list',
              alias: '',
              component: ConjurationList,
              props: {
                mine: true,
              },
              beforeEnter: authGuard,
              meta: {
                paidRequired: true,
              },
            },
            {
              path: 'view/:conjurationId',
              component: ViewConjuration,
              beforeEnter: authGuard,
              meta: {
                paidRequired: true,
              },
            },
          ],
        },
        {
          name: 'GALLERY',
          path: '/gallery',
          component: ConjuringView,
          beforeEnter: authGuard,
          children: [
            {
              path: 'list',
              alias: '',
              component: ConjurationList,
              props: {
                mine: false,
              },
              beforeEnter: authGuard,
              meta: {
                paidRequired: true,
              },
            },
          ],
        },
        {
          name: 'CAMPAIGN',
          path: '/campaign',
          component: CampaignsView,
          beforeEnter: authGuard,
          children: [
            {
              path: 'edit',
              alias: '',
              component: ViewCampaign,
              beforeEnter: authGuard,
            },
            {
              path: 'overview',
              component: OverviewCampaign,
              beforeEnter: authGuard,
            },
          ],
        },
        {
          name: 'SESSION',
          path: '/sessions',
          component: SessionsView,
          beforeEnter: authGuard,
          children: [
            {
              path: 'list',
              alias: '',
              component: ListSessions,
              beforeEnter: authGuard,
            },
            {
              path: ':sessionId',
              component: ViewSession,
              beforeEnter: authGuard,
            },
          ],
        },
        {
          name: 'ACCOUNT',
          path: '/account-settings',
          component: AccountView,
          beforeEnter: authGuard,
        },
      ],
    },
    {
      name: 'CONJURE',
      path: '/conjure',
      component: ConjureView,
      beforeEnter: authGuard,
      meta: {
        paidRequired: true,
      },
    },
    {
      name: 'COLLECTIONS',
      path: '/collections',
      component: CollectionsView,
      beforeEnter: authGuard,
      meta: {
        paidRequired: true,
      },
    },
    {
      name: 'RELATIONSHIP GRAPH',
      path: '/relationships/graph',
      component: RelationshipGraphView,
      beforeEnter: authGuard,
      meta: {
        paidRequired: true,
      },
    },
    {
      path: '/image-gallery',
      name: 'ImageGallery',
      component: ImageGalleryView,
      beforeEnter: authGuard,
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeResolve((to, from, next) => {
  if (from.path === '/' && to.redirectedFrom?.path === '/subscribed' && isProduction) {
    fbq('track', 'Purchase');
    rdt('track', 'Purchase');
    gtag('event', 'conversion', {
      send_to: 'AW-16543803684/iS19CODC6rYZEKTS2dA9',
      transaction_id: '',
    });
  }

  return next();
});

export default router;
