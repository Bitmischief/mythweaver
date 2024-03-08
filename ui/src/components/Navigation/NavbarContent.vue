<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { CAMPAIGN_CREATED_EVENT, useEventBus } from '@/lib/events.ts';
import { useRouter } from 'vue-router';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { storeToRefs } from 'pinia';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { Campaign } from '@/api/campaigns.ts';
import {
  BookmarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
} from '@heroicons/vue/20/solid';
import {
  Squares2X2Icon,
  SparklesIcon,
  PhotoIcon,
} from '@heroicons/vue/24/outline';

defineProps<{
  collapsed?: boolean;
}>();
const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const emit = defineEmits(['nav-item-selected']);

const { selectedCampaign, selectedCampaignId, campaigns } =
  storeToRefs(campaignStore);

const filteredCampaigns = ref<Campaign[]>([]);
const query = ref('');

onMounted(async () => {
  await loadCampaigns();
});

eventBus.$on(CAMPAIGN_CREATED_EVENT, async () => {
  await loadCampaigns();
});

async function loadCampaigns() {
  await campaignStore.loadCampaigns();
  if (query.value) {
    filteredCampaigns.value = campaigns.value.filter((campaign) =>
      campaign.name.toLowerCase().includes(query.value.toLowerCase()),
    );
  }

  filteredCampaigns.value = campaigns.value;
}

watch(selectedCampaignId, async () => {
  if (selectedCampaignId.value === undefined) {
    return;
  }

  await campaignStore.selectCampaign(selectedCampaignId.value);
});

watch(query, async () => {
  await loadCampaigns();
});

async function navigateToCreateCampaign() {
  await router.push('/campaigns/new');
}
</script>

<template>
  <div class="flex w-full flex-col mt-4">
    <router-link
      class="button-gradient flex justify-center"
      to="/conjurations/new"
    >
      <span class="self-center">Conjure</span>
      <img src="@/assets/icons/wand.svg" alt="wand" class="w-6 p-1 ml-1" />
    </router-link>

    <div class="text-xs text-gray-500 font-bold mb-3 mt-6">CAMPAIGN</div>
    <Menu v-model="selectedCampaignId" class="my-0.5">
      <div class="relative mt-1">
        <MenuButton
          class="relative h-10 w-full cursor-pointer rounded-xl pl-4 pr-8 text-left text-white flex items-center text-sm border border-surface-3 hover:bg-purple-800/20"
        >
          <BookmarkIcon v-show="collapsed" class="w-6 h-6 overflow-visible" />
          <span class="block truncate">{{
            selectedCampaign?.name || 'New Campaign'
          }}</span>
          <span
            v-if="!collapsed"
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <ChevronUpDownIcon
              v-if="selectedCampaign?.name"
              class="h-5 w-5 text-white"
              aria-hidden="true"
            />
            <PlusIcon v-else class="mr-2 h-5 w-5 text-white" />
          </span>
        </MenuButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <MenuItems
            class="default-border-no-opacity absolute mt-1 max-h-60 max-w-[300px] z-50 overflow-auto rounded-md py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm"
            :class="{ 'w-auto': collapsed, 'w-full': !collapsed }"
          >
            <MenuItem
              v-for="campaign in campaigns"
              v-slot="{ active }"
              :key="campaign.name"
              :value="campaign.id"
              as="template"
            >
              <div
                :class="[
                  active ? 'bg-purple-800/20 text-purple-200' : 'text-white',
                  'relative cursor-default select-none py-2 rl-10 pl-4 pr-8',
                ]"
                @click="selectedCampaignId = campaign.id"
              >
                <span
                  :class="[
                    selectedCampaign?.id === campaign.id
                      ? 'font-medium'
                      : 'font-normal',
                    'block truncate',
                  ]"
                  >{{ campaign.name }}</span
                >
                <span
                  v-if="selectedCampaign?.id === campaign.id"
                  class="absolute inset-y-0 right-0 flex items-center pr-4 text-purple-300"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </MenuItem>
            <MenuItem
              v-slot="{ active }"
              :key="'new_campaign'"
              as="template"
              :value="-1"
              @click="navigateToCreateCampaign"
              @keyup.enter="navigateToCreateCampaign"
            >
              <div
                :class="[
                  active ? 'bg-purple-800/20 text-purple-200' : 'text-white',
                  'relative flex justify-between cursor-default select-none py-2 pl-4',
                ]"
              >
                <span> New Campaign </span>
                <PlusIcon class="mr-4 h-5 w-5 text-white" />
              </div>
            </MenuItem>
          </MenuItems>
        </transition>
      </div>
    </Menu>
    <router-link
      class="nav-item"
      :class="[
        router.currentRoute.value.fullPath.startsWith('/campaign/overview')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/campaign/overview"
      @click="emit('nav-item-selected')"
    >
      <Squares2X2Icon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Overview</div>
    </router-link>
    <router-link
      class="nav-item"
      :class="[
        router.currentRoute.value.path.startsWith('/characters')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/characters"
      @click="emit('nav-item-selected')"
    >
      <img
        src="@/assets/icons/characters.svg"
        alt="characters"
        class="h-5 mr-2"
      />
      <div v-if="!collapsed" class="whitespace-nowrap">Characters</div>
    </router-link>
    <router-link
      class="nav-item"
      :class="[
        router.currentRoute.value.path.startsWith('/sessions')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/sessions"
      @click="emit('nav-item-selected')"
    >
      <img src="@/assets/icons/sessions.svg" alt="sessions" class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Sessions</div>
    </router-link>

    <div class="text-xs text-gray-500 font-bold mb-3 mt-6">TOOLS</div>

    <router-link
      class="nav-item"
      :class="[
        router.currentRoute.value.fullPath.startsWith('/conjurations#saved')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/conjurations#saved"
      @click="emit('nav-item-selected')"
    >
      <SparklesIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">My Conjurations</div>
    </router-link>

    <router-link
      class="nav-item"
      :class="[
        router.currentRoute.value.fullPath.startsWith('/conjurations#gallery')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/conjurations#gallery"
      @click="emit('nav-item-selected')"
    >
      <PhotoIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Gallery</div>
    </router-link>
  </div>
</template>
