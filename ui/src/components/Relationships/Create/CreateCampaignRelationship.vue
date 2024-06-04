<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { getCampaigns } from '@/api/campaigns.ts';
import { postConjurationRelationship } from '@/api/relationships.ts';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { LinkIcon } from '@heroicons/vue/24/outline';
import { debounce } from 'lodash';
import Spinner from '@/components/Core/Spinner.vue';
import { useEventBus } from '@/lib/events.ts';
import { CheckCircleIcon } from '@heroicons/vue/20/solid';
import { format } from 'date-fns';

defineEmits(['relationship-created']);

const props = defineProps<{
  nodeId: number;
  nodeType: ConjurationRelationshipType;
}>();

let loading = ref(false);
let eventBus = useEventBus();

onMounted(async () => {
  try {
    await fetchCampaigns();
  } catch (e: any) {
    showError({ message: e.message });
  } finally {
    loading.value = false;
  }
});

let searchText = ref<string | undefined>();
let campaigns = ref<any[]>([]);
let loadingCampaigns = ref(true);
let page = ref(0);
let moreToLoad = ref(true);

watch(
  searchText,
  debounce(async () => {
    page.value = 0;
    await fetchCampaigns(false);
  }, 1000),
);

async function loadNextPage() {
  page.value += 1;
  await fetchCampaigns();
}

async function fetchCampaigns(concat = true) {
  try {
    loadingCampaigns.value = true;
    const pageSize = 25;
    const search =
      searchText.value !== undefined && searchText.value === ''
        ? undefined
        : searchText.value;
    const response = await getCampaigns({
      offset: page.value * pageSize,
      limit: pageSize,
      term: search,
    });
    const results = response.data.data.filter((c: any) =>
      props.nodeType === ConjurationRelationshipType.CAMPAIGN
        ? c.id !== props.nodeId
        : true,
    );
    moreToLoad.value = !(response.data.data.length < pageSize);
    if (results.length) {
      if (concat) {
        campaigns.value = campaigns.value.concat(results);
      } else {
        campaigns.value = results;
      }
    }
  } catch (e: any) {
    showError({
      message: `Something went wrong fetching campaigns.`,
      context: e.message,
    });
  } finally {
    loadingCampaigns.value = false;
  }
}

const linking = ref<number>(-1);

async function linkCampaign(campaign: CampaignBase) {
  linking.value = campaign.id;
  try {
    await postConjurationRelationship(
      campaign.id,
      ConjurationRelationshipType.CAMPAIGN,
      {
        relatedNodeId: props.nodeId,
        relatedNodeType: props.nodeType,
      },
    );
    showSuccess({ message: 'Conjuration relationship created!' });
    campaign.linked = true;
    eventBus.$emit('relationship-created', {
      nodeId: props.nodeId,
      nodeType: props.nodeType,
    });
  } catch (e: any) {
    showError({
      message: 'Something went wrong creating the conjuration relationship',
    });
  } finally {
    linking.value = -1;
  }
}

function campaignDateDisplay(campaign: CampaignBase) {
  if (!campaign.date) {
    return 'TBD';
  }
  return format(campaign.date, 'MMM d, yyyy @ h:mm a');
}

const primaryImageUri = (data: any) => {
  if (data?.images?.length) {
    return data.images?.find((i: any) => i.primary)?.uri;
  }
  return undefined;
};
</script>

<template>
  <div class="mt-2">
    <FormKit
      v-model="searchText"
      type="text"
      placeholder="Search campaigns"
      autofocus
    />
  </div>
  <div v-show="!loading && !loadingCampaigns" class="h-[calc(100%-3em)]">
    <div class="h-full overflow-y-auto">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 pr-2">
        <div
          v-for="(campaign, i) in campaigns"
          :key="`campaign_${i}`"
          class="bg-surface-3 rounded-[12px] p-2"
        >
          <div class="relative">
            <img
              :src="
                primaryImageUri(campaign) || '/images/campaign_bg_square.png'
              "
              alt="campaign image"
              class="mx-auto w-full h-auto rounded-[12px]"
            />
          </div>
          <div class="flex justify-between mt-2">
            <div
              class="self-center whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {{ campaign.name }}
            </div>
            <div
              class="relative self-center"
              :class="{ 'group hover:text-fuchsia-500': linking === -1 }"
            >
              <LinkIcon
                v-if="linking !== campaign.id && !campaign.linked"
                class="h-8 w-8"
                :class="{
                  'cursor-not-allowed text-neutral-500': linking !== -1,
                  'cursor-pointer': linking === -1,
                }"
                @click="linkCampaign(campaign)"
              />
              <CheckCircleIcon v-else-if="campaign.linked" class="h-8 w-8" />
              <Spinner v-else class="h-8 w-8" />
              <div
                class="group-hover:block absolute -top-6 right-0 bg-surface-2 px-2 rounded-full hidden text-neutral-300 whitespace-nowrap"
              >
                <span v-if="!campaign.linked">Create Relationship</span>
                <span v-else>Relationship Exists</span>
              </div>
            </div>
          </div>
          <div class="text-sm text-neutral-500">
            {{ campaignDateDisplay(campaign) }}
          </div>
        </div>
        <div v-if="moreToLoad" class="text-center col-span-full">
          <button class="button-gradient" @click="loadNextPage">
            Load More
          </button>
        </div>
        <div v-else class="text-center col-span-full">No more results...</div>
      </div>
    </div>
  </div>
  <div v-show="loading || loadingCampaigns" class="flex justify-center h-full">
    <div class="my-auto min-w-[20vw] animate-pulse">Loading Campaigns...</div>
  </div>
</template>

<style scoped></style>
