<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { getRelationshipGraph } from '@/api/relationships.ts';
import { showError } from '@/lib/notifications.ts';
import Loader from '@/components/Core/Loader.vue';
import ForceGraph from '@/components/Relationships/Graphs/ForceGraph.vue';
import { useSelectedCampaignId } from '@/lib/hooks';

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
</script>

<template>
  <div class="h-full w-full">
    <div class="flex flex-wrap justify-between mb-4">
      <div class="flex gap-2">
        <div class="text-xl gradient-text self-center">
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
