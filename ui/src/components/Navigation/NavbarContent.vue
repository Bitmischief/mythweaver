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
import { useCurrentUserId, useCurrentUserPlan } from '@/lib/hooks.ts';
import { BillingPlan } from '@/api/users.ts';
import {
  BookOpenText,
  Clock,
  LayoutDashboard,
  ScrollText,
  Sparkles,
  TableCellsMerge,
  VenetianMask,
  WandSparkles,
  Workflow,
} from 'lucide-vue-next';

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
</script>

<template>
  <div class="flex w-full flex-col">
    <div class="mt-4">
      <router-link
        class="button-gradient nav-item text-white justify-center"
        to="/conjure"
        @click="emit('nav-item-selected')"
      >
        <WandSparkles class="h-5 mr-1" />
        <span class="self-center">Conjure</span>
      </router-link>
    </div>

    <Menu v-model="selectedCampaignId" class="mb-0.5">
      <div class="relative mt-1">
        <MenuButton
          class="relative h-10 w-full cursor-pointer rounded-xl pl-1 pr-8 text-left text-neutral-300 font-bold flex items-center text-sm hover:bg-purple-800/20"
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
    <div class="border-l border-neutral-700 ml-1 pl-4">
      <router-link
        class="nav-item"
        :class="[
          route.fullPath.startsWith('/campaign/overview') ||
          route.query['from']?.startsWith('/campaign/overview')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/campaign/overview"
        @click="emit('nav-item-selected')"
      >
        <LayoutDashboard class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">Overview</div>
      </router-link>
      <router-link
        class="nav-item"
        :class="[
          route.path.startsWith('/characters') ||
          route.query['from']?.startsWith('/characters')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/characters"
        @click="emit('nav-item-selected')"
      >
        <VenetianMask class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">Characters</div>
      </router-link>
      <router-link
        class="nav-item"
        :class="[
          route.path.startsWith('/sessions') ||
          route.query['from']?.startsWith('/sessions')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/sessions"
        @click="emit('nav-item-selected')"
      >
        <BookOpenText class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">Sessions</div>
      </router-link>
      <router-link
        class="nav-item"
        :class="[
          route.fullPath.startsWith('/collections') ||
          route.query['from']?.startsWith('/collections')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/collections"
        @click="emit('nav-item-selected')"
      >
        <Sparkles class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">Collections</div>
      </router-link>

      <router-link
        class="nav-item"
        :class="[
          route.fullPath.startsWith('/relationships') ||
          route.query['from']?.startsWith('/relationships/graph')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/relationships/graph"
        @click="emit('nav-item-selected')"
      >
        <Workflow class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">Relationships</div>
      </router-link>
    </div>

    <div class="text-neutral-300 font-bold mb-3 mt-6">Conjurations</div>
    <div class="border-l border-neutral-700 ml-1 pl-4">
      <router-link
        class="nav-item"
        :class="[
          route.fullPath.startsWith('/conjurations#saved') ||
          route.query['from']?.startsWith('/conjurations#saved')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/conjurations#saved"
        @click="emit('nav-item-selected')"
      >
        <ScrollText class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">My Conjurations</div>
      </router-link>

      <router-link
        class="nav-item"
        :class="[
          route.fullPath.startsWith('/conjurations#history') ||
          route.query['from']?.startsWith('/conjurations#history')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/conjurations#history"
        @click="emit('nav-item-selected')"
      >
        <Clock class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">
          Conjuration History
        </div>
      </router-link>

      <router-link
        class="nav-item"
        :class="[
          route.fullPath.startsWith('/conjurations#gallery') ||
          route.query['from']?.startsWith('/conjurations#gallery')
            ? 'bg-purple-800/20 text-purple-500'
            : '',
        ]"
        to="/conjurations#gallery"
        @click="emit('nav-item-selected')"
      >
        <TableCellsMerge class="h-5 mr-2" />
        <div v-if="!collapsed" class="whitespace-nowrap">Public Gallery</div>
      </router-link>
    </div>
  </div>
  <div v-if="currentUserPlan !== BillingPlan.Pro" class="mt-auto">
    <div
      class="mb-4 mt-2 w-full upgrade-box rounded-[12px] text-neutral-200 px-3 py-2"
    >
      <Sparkles class="h-5 w-5 mt-1 mb-2" />
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
