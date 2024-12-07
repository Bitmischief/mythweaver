<script setup lang="ts">
import { watch } from 'vue';
import ConjurationListHeader from './conjurationListHeader.vue';
import ConjurationListData from './conjurationListData.vue';

import { useConjurationStore } from '../../store/conjuration.store';
import { storeToRefs } from 'pinia';

const { conjurationListFilters } = storeToRefs(useConjurationStore());
const { getConjurations } = useConjurationStore();

watch(
  () => conjurationListFilters,
  async () => {
    await getConjurations({
      offset: 0,
      limit: 10,
      ...conjurationListFilters.value,
    });
  },
  { deep: true },
);
</script>

<template>
  <ConjurationListHeader />
  <ConjurationListData />
</template>
