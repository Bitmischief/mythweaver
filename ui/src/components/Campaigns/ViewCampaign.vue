<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { Campaign, getCampaign, PublicAdventure } from "@/api/campaigns.ts";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { getRpgSystems, RpgSystem } from "@/api/rpgSystems.ts";
import Select from "@/components/Core/Forms/Select.vue";
import { useSelectedCampaignId } from "@/lib/hooks.ts";
import { useEventBus } from "@/lib/events.ts";

const campaignStore = useCampaignStore();
const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();

const campaign = ref<Campaign>({} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(999);

onMounted(async () => {
  if (!selectedCampaignId.value) {
    return;
  }

  await init();

  eventBus.$on("campaign-selected", async () => {
    await init();
  });
});

async function init() {
  const getCampaignResponse = await getCampaign(selectedCampaignId.value || 0);
  campaign.value = getCampaignResponse.data;

  await loadRpgSystems();
}

watch(
  campaign,
  () => {
    loadAdventures();
  },
  { deep: true },
);

function loadAdventures() {
  const rpgSystem = rpgSystems.value.find(
    (s) => s.code === campaign.value?.rpgSystemCode,
  );

  if (rpgSystem) {
    adventures.value = rpgSystem.publicAdventures ?? [];
  }
}

async function loadRpgSystems() {
  const rpgSystemsResponse = await getRpgSystems({
    offset: 0,
    limit: systemsLimit.value,
  });
  rpgSystems.value = rpgSystemsResponse.data.data;

  loadAdventures();
}

async function handleSaveCampaign() {
  if (!campaign.value) {
    return;
  }

  await campaignStore.saveCampaign({
    campaignId: selectedCampaignId.value || 0,
    name: campaign.value.name,
    description: campaign.value.description,
    imageUri: campaign.value.imageUri,
    rpgSystemCode: campaign.value.rpgSystemCode,
    publicAdventureCode: campaign.value.publicAdventureCode,
  });
}

async function handleDeleteCampaign() {
  if (!campaign.value) {
    return;
  }

  await campaignStore.deleteCampaign(selectedCampaignId.value || 0);
}
</script>

<template>
  <div v-if="campaign">
    <div class="flex justify-between">
      <div class="text-2xl">
        {{ campaign.name }}
      </div>

      <div>
        <button class="rounded-xl bg-green-500 p-3" @click="handleSaveCampaign">
          Save
        </button>
        <button
          class="ml-2 rounded-xl border border-red-500 p-3 text-red-500"
          @click="handleDeleteCampaign"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="mt-6 text-lg text-gray-400">
      What should we call this campaign?
    </div>

    <input
      v-model="campaign.name"
      class="gradient-border-no-opacity relative mt-2 h-12 w-full rounded-xl border bg-black px-4 text-left text-white"
      placeholder="Flight of the Valkyries"
    />

    <div class="mt-8 text-lg text-gray-400">
      What roleplaying system are you using?
    </div>

    <Select
      v-model="campaign.rpgSystemCode"
      :options="rpgSystems"
      value-prop="code"
      display-prop="name"
    />

    <template v-if="campaign.rpgSystemCode === 'other'">
      <div class="mt-6 text-lg text-gray-400">
        Please describe your campaign's universe and atmosphere in a few words?
      </div>

      <div class="text-md mt-2 rounded-xl bg-blue-400 p-2">
        We use this information to help generating contextually appropriate
        content for your campaign.

        <div class="mt-1 text-sm">
          For example, a sci-fi campaign might have the keywords
          <div class="mt-1 flex">
            <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">scifi</div>
            <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">space</div>
            <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">futuristic</div>
          </div>
        </div>
      </div>
    </template>

    <div class="mt-6 text-lg text-gray-400">
      Are you playing an official campaign/adventure?
    </div>

    <Select
      v-model="campaign.publicAdventureCode"
      :options="adventures"
      value-prop="code"
      display-prop="name"
      allow-none
    />
  </div>
</template>
