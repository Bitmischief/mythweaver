<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { getConjurationRelationships } from '@/api/relationships.ts';
import { showError } from '@/lib/notifications.ts';
import { useEventBus } from '@/lib/events.ts';
import RelationshipRow from '@/components/Relationships/RelationshipRow.vue';

const eventBus = useEventBus();
const props = defineProps<{
  startNodeId: number;
  startNodeType: ConjurationRelationshipType;
}>();
const relationships = ref<any[]>([]);

onMounted(async () => {
  await fetchRelationships();
  eventBus.$on('relationship-created', async (nodeInfo: any) => {
    if (nodeInfo.conjurationId === props.startNodeId) {
      await fetchRelationships();
    }
  });
});

onUnmounted(() => {
  eventBus.$off('relationship-created');
});

async function fetchRelationships() {
  try {
    const response = await getConjurationRelationships(
      props.startNodeId,
      props.startNodeType,
    );
    relationships.value = response.data.filter((r: any) => r.depth === 1);
  } catch (e: any) {
    showError({
      message:
        'Something went wrong fetching session relationships. Please refresh the page to try again.',
    });
  }
}
</script>

<template>
  <div v-if="relationships.length">
    <div
      v-for="relationship in relationships"
      :key="`r_${relationship.id}`"
      class="flex justify-between bg-surface-2 p-1 rounded-[12px] mb-2"
    >
      <RelationshipRow :data="relationship" @deleted="fetchRelationships" />
    </div>
  </div>
  <div v-else class="text-center my-10">No Relationships Found</div>
</template>

<style scoped></style>
