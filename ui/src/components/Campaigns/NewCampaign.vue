<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/20/solid';
import { Campaign, createCampaign, PublicAdventure } from '@/api/campaigns.ts';
import { onMounted, ref, watch } from 'vue';
import { getRpgSystems, RpgSystem } from '@/api/rpgSystems.ts';
import { useRouter } from 'vue-router';
import { showSuccess } from '@/lib/notifications.ts';
import { CAMPAIGN_CREATED_EVENT, useEventBus } from '@/lib/events.ts';
import { useCampaignStore } from '@/store/campaign.store.ts';
import TagInput from '@/components/Core/Forms/TagInput.vue';
import Select from '@/components/Core/Forms/Select.vue';

const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const campaign = ref<Campaign>({
  name: '',
  rpgSystemCode: 'dnd',
  publicAdventureCode: null,
  atmosphere: [],
} as Campaign);
const rpgSystems = ref<RpgSystem[]>([]);
const adventures = ref<PublicAdventure[]>([]);
const systemsLimit = ref(999);
const campaignName = ref<HTMLElement | null>(null);

onMounted(async () => {
  await loadRpgSystems();
  campaignName.value?.focus();
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
    name: campaign.value.name.length ? campaign.value.name : 'New Campaign',
  });
  await campaignStore.loadCampaigns();
  await campaignStore.selectCampaign(createCampaignResponse.data.id);

  eventBus.$emit(CAMPAIGN_CREATED_EVENT, undefined);

  showSuccess({ message: 'Campaign created!' });
  await router.push('/');
}

const atmosphere = ref<string[]>([]);
</script>

<template>
  <div class="flex items-center justify-center h-full">
    <div
      class="text-white min-w-[30em] max-w-[50em] min-h-[30em] max-h-[50em] bg-surface-2 rounded-[20px] p-10"
    >
      <div class="text-center text-white text-xl text-neutral-500">
        No campaign yet. <br />
        Create or join one.
      </div>

      <div class="mt-8 text-sm text-gray-400 m-1">Campaign Name</div>

      <input
        ref="campaignName"
        v-model="campaign.name"
        autofocus
        class="input-ghost"
        placeholder="What should we call this campaign?"
      />

      <div class="mt-8 mb-1 text-sm text-gray-400 m-1">Roleplaying System</div>

      <Select
        v-model="campaign.rpgSystemCode"
        :options="rpgSystems"
        value-prop="code"
        display-prop="name"
        placeholder="What roleplaying system are you using?"
      />

      <template v-if="campaign.rpgSystemCode === 'other'">
        <div class="mt-6 text-sm text-gray-400">
          Please describe your campaign's universe and atmosphere in a few
          words:
        </div>

        <div class="text-xs mt-2 p-2 text-gray-400">
          We use this information to help generating contextually appropriate
          content for your campaign.

          <div class="mt-1 text-xs text-gray-400">
            For example, a sci-fi campaign might have the keywords
            <div class="mt-1 flex">
              <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">sci-fi</div>
              <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">space</div>
              <div class="mr-1 rounded bg-gray-600/20 p-1 px-2">futuristic</div>
            </div>
          </div>
        </div>

        <TagInput v-model="atmosphere" class="mt-2" />
      </template>

      <template v-if="campaign.rpgSystemCode !== 'other'">
        <div class="mt-6 mb-1 text-sm text-gray-400">Campaign Source</div>

        <Select
          v-model="campaign.publicAdventureCode"
          :options="adventures"
          value-prop="code"
          display-prop="name"
          allow-none
        />
      </template>

      <div v-if="campaign.rpgSystemCode" class="mt-6 text-center">
        <button
          class="mt-4 rounded-xl bg-gradient px-4 py-3 text-sm"
          @click="handleCreateCampaign"
        >
          <PlusIcon class="inline-block h-5 w-5" /> Create new campaign
        </button>
      </div>
    </div>
  </div>
</template>
