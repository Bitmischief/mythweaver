import { createRouter, createWebHistory } from "vue-router";
import CharactersView from "@/views/CharactersView.vue";
import LoginView from "@/views/LoginView.vue";
import { useAuthStore } from "@/store";
import ViewCharacter from "@/components/Characters/ViewCharacter.vue";
import ListCharacters from "@/components/Characters/ListCharacters.vue";
import CampaignsView from "@/views/CampaignsView.vue";
import ListCampaigns from "@/components/Campaigns/ListCampaigns.vue";
import NewCampaign from "@/components/Campaigns/NewCampaign.vue";
import SummoningView from "@/views/SummoningView.vue";
import ListSummoners from "@/components/Summoning/ListSummoners.vue";
import ViewSummoner from "@/components/Summoning/ViewSummoner.vue";
import ViewCampaign from "@/components/Campaigns/ViewCampaign.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: "LOGIN",
      path: "/login",
      component: LoginView,
    },
    {
      name: "HOME",
      path: "/",
      redirect: "/characters",
    },
    {
      name: "CHARACTERS",
      path: "/characters",
      component: CharactersView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: "list",
          alias: "",
          component: ListCharacters,
        },
        {
          path: ":characterId",
          component: ViewCharacter,
        },
      ],
    },
    {
      name: "CAMPAIGNS",
      path: "/campaigns",
      component: CampaignsView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: "list",
          alias: "",
          component: ListCampaigns,
        },
        {
          path: "new",
          component: NewCampaign,
        },
      ],
    },
    {
      name: "SUMMONING",
      path: "/summoning",
      component: SummoningView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: "list",
          alias: "",
          component: ListSummoners,
        },
        {
          path: "view/:summonerCode",
          component: ViewSummoner,
        },
      ],
    },
    {
      name: "CAMPAIGN",
      path: "/campaign",
      component: CampaignsView,
      meta: {
        authRequired: true,
      },
      children: [
        {
          path: "edit",
          alias: "",
          component: ViewCampaign,
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
    return "/login";
  }
});

export default router;
