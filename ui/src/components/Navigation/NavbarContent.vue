<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { CAMPAIGN_CREATED_EVENT, useEventBus } from '@/lib/events.ts';
import { useRoute, useRouter } from 'vue-router';
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
  BookmarkSquareIcon,
  PhotoIcon,
  SparklesIcon,
  ClockIcon,
  StarIcon,
  UsersIcon,
  SquaresPlusIcon,
  ShareIcon,
} from '@heroicons/vue/24/outline';
import { useCurrentUserId, useCurrentUserPlan } from '@/lib/hooks.ts';
import { BillingPlan } from '@/api/users.ts';


defineProps<{
  collapsed?: boolean;
}>();

const router = useRouter();
const route = useRoute();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();
const currentUserPlan = useCurrentUserPlan();
const currentUserId = useCurrentUserId();

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

const myCampaigns = computed(() => {
  return campaigns.value.filter((c: any) => c.userId === currentUserId.value);
});

const joinedCampaigns = computed(() => {
  return campaigns.value.filter((c: any) => c.userId !== currentUserId.value);
});

const isActive = (path: string) =>
  computed(() => route.fullPath.startsWith(path));
</script>

<template>
  <div class="flex w-full flex-col my-4">
    <router-link
      class="button-gradient flex justify-center text-white"
      to="/conjure"
      @click="emit('nav-item-selected')"
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
            <div
              v-if="myCampaigns.length"
              class="text-xs text-neutral-500 px-4 pt-2"
            >
              <div>My Campaigns</div>
              <hr class="border-neutral-600" />
            </div>
            <MenuItem
              v-for="campaign in myCampaigns"
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
            <div
              v-if="joinedCampaigns.length"
              class="text-xs text-neutral-500 px-4 pt-2"
            >
              <div>Joined Campaigns</div>
              <hr class="border-neutral-600" />
            </div>
            <MenuItem
              v-for="campaign in joinedCampaigns"
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
            <div class="px-4 mt-2">
              <hr class="border-neutral-600" />
            </div>
            <MenuItem
              v-slot="{ active }"
              :key="'new_campaign'"
              as="template"
              :value="-1"
              @click="navigateToCreateCampaign"
              @keyup.enter="navigateToCreateCampaign"
            >
              <div
                class="button-secondary m-2 justify-between"
                :class="[
                  active ? 'bg-purple-800/20 text-purple-200' : 'text-white',
                  'relative flex justify-between cursor-default select-none py-2 pl-4',
                ]"
              >
                <span> New Campaign </span>
                <PlusIcon class="h-5 w-5 text-white" />
              </div>
            </MenuItem>
          </MenuItems>
        </transition>
      </div>
    </Menu>
    <router-link
      class="nav-item"
      :class="[
        route.fullPath.startsWith('/campaign/overview')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/campaign/overview"
      @click="emit('nav-item-selected')"
    >
      <StarIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Campaign Overview</div>
    </router-link>
    <router-link
      class="nav-item"
      :class="[
        route.path.startsWith('/characters') ? 'default-border-no-opacity' : '',
      ]"
      to="/characters"
      @click="emit('nav-item-selected')"
    >
      <UsersIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Campaign Characters</div>
    </router-link>
    <router-link
      class="nav-item"
      :class="[
        route.path.startsWith('/sessions') ? 'default-border-no-opacity' : '',
      ]"
      to="/sessions"
      @click="emit('nav-item-selected')"
    >
      <img src="@/assets/icons/sessions.svg" alt="sessions" class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Campaign Sessions</div>
    </router-link>

    <div class="text-xs text-gray-500 font-bold mb-3 mt-6">CONJURATIONS</div>

    <router-link
      class="nav-item"
      :class="[
        route.fullPath.startsWith('/conjurations#saved')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/conjurations#saved"
      @click="emit('nav-item-selected')"
    >
      <BookmarkSquareIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">My Conjurations</div>
    </router-link>

    <router-link
      class="nav-item"
      :class="[
        route.fullPath.startsWith('/conjurations#history')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/conjurations#history"
      @click="emit('nav-item-selected')"
    >
      <ClockIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">
        My Conjuration History
      </div>
    </router-link>

    <router-link
      class="nav-item"
      :class="[
        route.fullPath.startsWith('/image-gallery')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/image-gallery"
      @click="emit('nav-item-selected')"
    >
      <PhotoIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">Image Gallery</div>
    </router-link>

    <div class="text-xs text-gray-500 font-bold mb-3 mt-6">TOOLS</div>

    <router-link
      class="nav-item"
      :class="[
        route.fullPath.startsWith('/collections')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/collections"
      @click="emit('nav-item-selected')"
    >
      <SquaresPlusIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">My Collections</div>
    </router-link>

    <router-link
      class="nav-item"
      :class="[
        route.fullPath.startsWith('/relationships')
          ? 'default-border-no-opacity'
          : '',
      ]"
      to="/relationships/graph"
      @click="emit('nav-item-selected')"
    >
      <ShareIcon class="h-5 mr-2" />
      <div v-if="!collapsed" class="whitespace-nowrap">
        Relationship Visualizer
      </div>
    </router-link>
  </div>
  <div v-if="currentUserPlan !== BillingPlan.Pro" class="mt-auto">
    <div
      class="mb-4 mt-2 w-full upgrade-box rounded-[12px] text-neutral-200 px-3 py-2"
    >
      <SparklesIcon class="h-5 w-5 mt-1 mb-2" />
      <div class="text-sm">Upgrade to pro</div>
      <div class="mt-1 mb-3 text-xs text-neutral-400">
        Upgrade your plan to enjoy more features
      </div>
      <button
        class="bg-gradient-to-tr from-[#E95252] to-[#E5AD59] w-full py-1 text-sm rounded-[6px]"
        @click="eventBus.$emit('show-subscription-modal')"
      >
        Upgrade plan
      </button>
    </div>
  </div>
</template>
