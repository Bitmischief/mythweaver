<script setup lang="ts">
import { onMounted } from 'vue';
import { useConjurationStore } from '../../store/conjuration.store';
import { storeToRefs } from 'pinia';
import ConjurationListItemView from '@/components/Conjuration/ConjurationListItemView.vue';

const { conjurationList, conjurationListFilters } = storeToRefs(
  useConjurationStore(),
);
const { getConjurations } = useConjurationStore();

onMounted(async () => {
  await getConjurations({
    offset: 0,
    limit: 10,
    ...conjurationListFilters.value,
  });
});
</script>

<template>
  <div class="grid grid-cols-4 gap-4">
    <div v-for="conjuration in conjurationList" :key="conjuration.id">
      <ConjurationListItemView
        :data="conjuration"
        :highlight-text="conjurationListFilters.search"
      />
    </div>
  </div>
</template>
