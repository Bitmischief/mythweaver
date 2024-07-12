<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getRelationshipGraph } from '@/api/relationships.ts';
import { showError } from '@/lib/notifications.ts';
import Loader from '@/components/Core/Loader.vue';
import ForceGraph from '@/components/Relationships/Graphs/ForceGraph.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { useRoute } from 'vue-router';
import router from '@/router/router.ts';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue';
import { storeToRefs } from 'pinia';
import { useCampaignStore } from '@/store/campaign.store.ts';

const route = useRoute();
const loading = ref(true);
const data = ref<any>(undefined);
const campaignStore = useCampaignStore();
const currentUserId = useCurrentUserId();
const { campaigns } = storeToRefs(campaignStore);

const campaignId = ref();

const myCampaigns = computed(() => {
  return campaigns.value.filter((c: any) => c.userId === currentUserId.value);
});

const selectedCampaign = computed(() => {
  return myCampaigns.value.find((c: any) => c.id === campaignId.value);
});

watch(campaignId, () => {
  fetchGraphData();
});

onMounted(async () => {
  await fetchGraphData();
});

async function fetchGraphData() {
  loading.value = true;

  try {
    const response = await getRelationshipGraph(campaignId.value);
    data.value = {
      nodes: response.data.nodes,
      links: response.data.links,
    };
  } catch {
    showError({
      message: 'Something went wrong fetching the graph. Please try again.',
    });
  } finally {
    loading.value = false;
  }
}

const back = () => {
  if (route.query.from) {
    router.push(route.query.from.toString());
  } else {
    router.push('/conjurations#saved');
  }
};
</script>

<template>
  <div class="h-full w-full">
    <div class="flex flex-wrap justify-between mb-4">
      <div class="flex gap-2">
        <button class="button-primary flex self-center" @click="back">
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
          Back
        </button>
        <div class="text-lg gradient-text self-center">
          Conjuration Relationships
        </div>
      </div>
      <div>
        <Menu v-model="campaignId" class="my-0.5 min-w-[12em]">
          <div class="relative mt-1">
            <MenuButton
              class="relative h-10 w-full cursor-pointer rounded-xl pl-4 pr-8 text-left text-white flex items-center text-sm border border-surface-3 hover:bg-purple-800/20"
            >
              <span class="block truncate">{{
                selectedCampaign?.name || 'Show All'
              }}</span>
              <span
                class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"
              >
                <ChevronUpDownIcon
                  class="h-5 w-5 text-white"
                  aria-hidden="true"
                />
              </span>
            </MenuButton>

            <transition
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <MenuItems
                class="default-border-no-opacity w-full absolute mt-1 max-h-60 max-w-[300px] z-50 overflow-auto rounded-md py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm"
              >
                <MenuItem
                  v-slot="{ active }"
                  key="Show All"
                  as="template"
                  :value="undefined"
                  @click="campaignId = undefined"
                >
                  <div
                    class="cursor-pointer"
                    :class="[
                      active
                        ? 'bg-purple-800/20 text-purple-200'
                        : 'text-white',
                      'relative flex justify-between cursor-default select-none py-2 pl-4',
                    ]"
                  >
                    <span> Show All </span>
                  </div>
                </MenuItem>
                <div
                  v-if="myCampaigns.length"
                  class="text-xs text-neutral-500 px-4 pt-2"
                >
                  <div>Campaign Collections</div>
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
                    class="cursor-pointer"
                    :class="[
                      active
                        ? 'bg-purple-800/20 text-purple-200'
                        : 'text-white',
                      'relative cursor-default select-none py-2 rl-10 pl-4 pr-8',
                    ]"
                    @click="campaignId = campaign.id"
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
                      class="absolute inset-y-0 right-0 flex items-center pr-2 text-purple-300"
                    >
                      <CheckIcon class="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                </MenuItem>
              </MenuItems>
            </transition>
          </div>
        </Menu>
      </div>
    </div>
    <div v-if="loading" class="flex justify-center">
      <div class="my-auto">
        <Loader />
        <div class="text-center text-xl mt-4 text-neutral-300">
          Loading Graph...
        </div>
      </div>
    </div>
    <div v-if="!loading && data" class="h-full w-full">
      <ForceGraph :data="data" />
    </div>
  </div>
</template>

<style scoped></style>
