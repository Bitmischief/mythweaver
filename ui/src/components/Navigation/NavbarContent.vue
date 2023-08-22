<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import { CAMPAIGN_CREATED_EVENT, useEventBus } from "@/lib/events.ts";
import { useRouter } from "vue-router";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";
import { Campaign } from "@/api/campaigns.ts";
import {
  PlusIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from "@heroicons/vue/20/solid";

const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const navItems = [
  {
    name: "Edit Campaign",
    path: "/campaign",
  },
  {
    name: "Sessions",
    path: "/sessions",
  },
  {
    name: "Conjurations",
    path: "/conjurations",
  },
];

const emit = defineEmits(["nav-item-selected"]);

const { selectedCampaign, selectedCampaignId, campaigns } =
  storeToRefs(campaignStore);

const filteredCampaigns = ref<Campaign[]>([]);
const query = ref("");

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
  await router.push("/campaigns/new");
}
</script>

<template>
  <div class="flex w-full flex-col">
    <Listbox v-model="selectedCampaignId" class="my-6 mt-4">
      <div class="relative mt-1">
        <ListboxButton
          class="gradient-border relative h-12 w-full cursor-pointer rounded-xl border bg-black px-4 text-left text-white"
        >
          <span class="block truncate">{{ selectedCampaign?.name }}</span>
          <span
            class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
          >
            <ChevronUpDownIcon
              class="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </ListboxButton>

        <transition
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <ListboxOptions
            class="gradient-border-no-opacity absolute mt-1 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          >
            <ListboxOption
              v-for="campaign in campaigns"
              v-slot="{ active }"
              :key="campaign.name"
              :value="campaign.id"
              as="template"
            >
              <li
                :class="[
                  active ? 'bg-purple-800/20 text-purple-200' : 'text-white',
                  'relative cursor-default select-none py-2 pl-10 pr-4',
                ]"
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
                  class="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-300"
                >
                  <CheckIcon class="h-5 w-5" aria-hidden="true" />
                </span>
              </li>
            </ListboxOption>
            <ListboxOption
              v-slot="{ active }"
              as="template"
              :value="undefined"
              @click="navigateToCreateCampaign"
              @keyup.enter="navigateToCreateCampaign"
            >
              <li
                :class="[
                  active ? 'bg-purple-800/20 text-purple-200' : 'text-white',
                  'relative flex cursor-default select-none py-2 pl-3',
                ]"
              >
                <PlusIcon class="mr-2 h-5 w-5 text-green-500" />
                <span> Create New </span>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </div>
    </Listbox>

    <router-link
      v-for="navItem in navItems"
      :key="navItem.name"
      class="text-md my-0.5 p-3 text-gray-300"
      :class="[
        router.currentRoute.value.path.startsWith(navItem.path)
          ? 'gradient-border-no-opacity '
          : '',
      ]"
      :to="navItem.path"
      @click="emit('nav-item-selected')"
    >
      {{ navItem.name }}
    </router-link>
  </div>
</template>
