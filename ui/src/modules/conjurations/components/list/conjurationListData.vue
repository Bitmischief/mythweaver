<script setup lang="ts">
import { onMounted } from 'vue';
import { useConjurationStore } from '../../store/conjuration.store';
import { useCondensedView } from '@/modules/core/composables/useCondensedView';
import { storeToRefs } from 'pinia';
import ConjurationListItem from './conjurationListItem.vue';

const { conjurationList, conjurationListFilters } = storeToRefs(
  useConjurationStore(),
);
const { getConjurations } = useConjurationStore();
const { condensed } = useCondensedView();

onMounted(async () => {
  await getConjurations({
    offset: 0,
    limit: 25,
    mine: true,
    saved: true,
    ...conjurationListFilters.value,
  });
});
</script>

<template>
  <div
    class="grid gap-4"
    :class="{
      'grid-cols-1 md:grid-cols-2 xl:grid-cols-3': condensed,
      'grid-cols-2 md:grid-cols-3 lg:grid-cols-4': !condensed,
    }"
  >
    <div v-for="conjuration in conjurationList" :key="conjuration.id">
      <ConjurationListItem :conjuration="conjuration" />
    </div>
  </div>
</template>
