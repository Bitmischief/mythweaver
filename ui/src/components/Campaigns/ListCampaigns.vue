<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Campaign, getCampaigns } from '@/api/campaigns.ts';
import { debounce } from 'lodash';

const campaignsSearch = ref({
  term: '',
  offset: 0,
  limit: 25,
});
const campaigns = ref<Campaign[]>([]);
const loadMore = ref(false);
const lastFilterTerm = ref('');

onMounted(async () => {
  await loadCampaigns();
});

async function loadCampaigns() {
  const getCampaignsResponse = await getCampaigns({
    ...campaignsSearch.value,
  });

  if (campaignsSearch.value.term !== lastFilterTerm.value) {
    campaigns.value = getCampaignsResponse.data.data;
  } else {
    campaigns.value.push(...getCampaignsResponse.data.data);
  }

  loadMore.value =
    getCampaignsResponse.data.data.length === getCampaignsResponse.data.limit;
}

const searchCampaigns = debounce(async () => {
  campaignsSearch.value.offset = 0;
  await loadCampaigns();
  lastFilterTerm.value = campaignsSearch.value.term;
}, 250);

async function loadMoreCampaigns() {
  campaignsSearch.value.offset += campaignsSearch.value.limit;
  await loadCampaigns();
}
</script>

<template>
  <input
    v-model="campaignsSearch.term"
    class="mb-4 rounded-xl bg-slate-800 p-2 text-lg"
    placeholder="Search..."
    @keyup="searchCampaigns"
  />

  <div v-if="campaigns.length === 0">
    <div class="text-2xl">No campaigns found!</div>
  </div>
  <div v-else>
    <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
      <router-link
        v-for="(campaign, i) of campaigns"
        :key="i"
        :to="`/campaigns/${campaign.id}`"
      >
        <div class="flex rounded-xl bg-purple-900 p-2">
          <div class="w-full">
            <div class="text-lg">
              {{ campaign.name }}
            </div>

            <div class="h-[3rem] overflow-hidden text-xs text-purple-300">
              {{ campaign.description || 'No description provided' }}
            </div>
          </div>

          <div v-if="campaign.imageUri" class="ml-2 w-[4rem] self-center">
            <img
              :src="campaign.imageUri"
              class="w-16 self-center rounded-full"
              alt=""
            />
          </div>
        </div>
      </router-link>
    </div>

    <div v-if="loadMore" class="mt-4 flex justify-center">
      <button
        class="rounded-xl bg-slate-800 p-2 px-10 text-lg"
        @click="loadMoreCampaigns"
      >
        Load more
      </button>
    </div>
  </div>
</template>
