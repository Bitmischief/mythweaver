<script setup lang="ts">
import { onMounted, watch } from "vue";
import { CAMPAIGN_CREATED_EVENT, useEventBus } from "@/lib/events.ts";
import { useRouter } from "vue-router";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";

const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const navItems = [
  {
    name: "Characters",
    path: "/characters",
  },
  {
    name: "Generators",
    path: "/generators/",
  },
];

const { selectedCampaignId, campaigns } = storeToRefs(campaignStore);

onMounted(async () => {
  await campaignStore.loadCampaigns();
});

eventBus.$on(CAMPAIGN_CREATED_EVENT, async () => {
  await campaignStore.loadCampaigns();
});

watch(selectedCampaignId, async () => {
  if (selectedCampaignId.value === -1) {
    await navigateToCreateCampaign();
    return;
  }

  await campaignStore.selectCampaign(selectedCampaignId.value);
});

async function navigateToCreateCampaign() {
  await router.push("/campaigns/new");
}
</script>

<template>
  <div class="flex w-full flex-col">
    <select
      v-model="selectedCampaignId"
      class="mb-4 rounded-xl bg-slate-800 p-2 text-white"
    >
      <option
        v-for="campaign in campaigns"
        :key="campaign.id"
        :value="campaign.id"
      >
        {{ campaign.name }}
      </option>
      <option :value="-1">Create Campaign</option>
    </select>

    <router-link
      v-for="navItem in navItems"
      :key="navItem.name"
      class="text-md my-2 text-gray-300"
      :to="navItem.path"
    >
      {{ navItem.name }}
    </router-link>
  </div>
</template>
