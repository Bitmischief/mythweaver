<script setup lang="ts">
import { ref, toRefs, onMounted } from 'vue';
import { useConjurationStore } from '../../store/conjuration.store';
import { useCondensedView } from '@/modules/core/composables/useCondensedView';
import { storeToRefs } from 'pinia';
import ConjurationListItem from './conjurationListItem.vue';
import { useConjurationListScroll } from '../../composables/useConjurationListScroll';

const listWrapper = ref<HTMLElement | null>(null);
const {
  conjurationList,
  conjurationListFilters,
  conjurationListFlags,
  conjurationListLoading,
} = storeToRefs(useConjurationStore());
const { getConjurations } = useConjurationStore();
const { condensed } = useCondensedView();
const { moreToLoad } = toRefs(useConjurationListScroll(listWrapper));

onMounted(async () => {
  await getConjurations({
    offset: 0,
    limit: 25,
    ...conjurationListFilters.value,
    ...conjurationListFlags.value,
  });
});
</script>

<template>
  <div ref="listWrapper" class="overflow-y-auto">
    <div class="min-h-[calc(100vh)]">
      <div
        class="grid gap-4 mt-2 pr-2"
        :class="{
          'grid-cols-1 md:grid-cols-2 xl:grid-cols-3': condensed,
          'grid-cols-2 md:grid-cols-3 lg:grid-cols-4': !condensed,
        }"
      >
        <div v-for="conjuration in conjurationList" :key="conjuration.id">
          <ConjurationListItem :conjuration="conjuration" />
        </div>
        <div
          v-if="!conjurationListLoading && !moreToLoad"
          class="flex justify-center mt-12 col-span-full"
        >
          No more results
        </div>
      </div>
    </div>
  </div>
</template>
