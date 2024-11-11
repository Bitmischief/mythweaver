<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { getRelationshipGraph } from '@/api/relationships.ts';
import { showError } from '@/lib/notifications.ts';
import Loader from '@/components/Core/Loader.vue';
import ForceGraph from '@/components/Relationships/Graphs/ForceGraph.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { useRoute } from 'vue-router';
import router from '@/router/router.ts';
import { useSelectedCampaignId } from '@/lib/hooks';

const route = useRoute();
const loading = ref(true);
const data = ref<any>(undefined);
const campaignId = useSelectedCampaignId();

watch(campaignId, async () => {
  await fetchGraphData();
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
