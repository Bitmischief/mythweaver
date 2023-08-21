<script setup lang="ts">
import { ArrowRightIcon } from "@heroicons/vue/24/outline";
import { Campaign, createCampaign, PublicAdventure } from "@/api/campaigns.ts";
import { onMounted, ref, watch } from "vue";
import { getRpgSystems, RpgSystem } from "@/api/rpgSystems.ts";
import { useRouter } from "vue-router";
import { showSuccess } from "@/lib/notifications.ts";
import { CAMPAIGN_CREATED_EVENT, useEventBus } from "@/lib/events.ts";
import { useCampaignStore } from "@/store/campaign.store.ts";
import TagInput from "@/components/Core/Forms/TagInput.vue";
import Select from "@/components/Core/Forms/Select.vue";

const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const campaign = ref<Campaign>({
  name: "",
  rpgSystemCode: "dnd",
  publicAdventureCode: null,
  atmosphere: [],
} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(999);

onMounted(async () => {
  await loadRpgSystems();
});

watch(
  campaign,
  () => {
    loadAdventures();
  },
  { deep: true },
);

function loadAdventures() {
  const rpgSystem = rpgSystems.value.find(
    (s) => s.code === campaign.value.rpgSystemCode,
  );
  adventures.value = rpgSystem?.publicAdventures ?? [];
}

async function loadRpgSystems() {
  const rpgSystemsResponse = await getRpgSystems({
    offset: 0,
    limit: systemsLimit.value,
  });
  rpgSystems.value = rpgSystemsResponse.data.data;

  loadAdventures();
}

async function handleCreateCampaign() {
  const createCampaignResponse = await createCampaign({
    ...campaign.value,
    name: campaign.value.name.length ? campaign.value.name : "New Campaign",
  });
  await campaignStore.loadCampaigns();
  await campaignStore.selectCampaign(createCampaignResponse.data.id);

  eventBus.$emit(CAMPAIGN_CREATED_EVENT, undefined);

  showSuccess({ message: "Campaign created!" });
  await router.push("/");
}

const atmosphere = ref<string[]>([]);
</script>

<template>
  <div class="">
    <div class="text-2xl">Let's Create A Campaign</div>

    <div class="mt-8 text-lg text-gray-400">
      What should we call this campaign?
    </div>

    <input
      v-model="campaign.name"
      autofocus
      class="gradient-border-no-opacity relative mt-2 h-12 w-full rounded-xl border bg-black px-4 text-left text-white"
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

      <TagInput v-model="atmosphere" class="mt-2" />
    </template>

    <template v-if="campaign.rpgSystemCode !== 'other'">
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
    </template>

    <div v-if="campaign.rpgSystemCode" class="mt-6">
      <button
        class="mt-4 rounded-xl bg-gradient p-3 px-5 text-lg"
        @click="handleCreateCampaign"
      >
        Start Your Adventure <ArrowRightIcon class="inline-block h-8" />
      </button>
    </div>
  </div>
</template>
