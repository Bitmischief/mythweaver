<script setup lang="ts">
import { watch } from 'vue';
import ConjurationListSearch from './conjurationListSearch.vue';
import ConjurationListFilter from './conjurationListFilter.vue';
import ConjurationListFilterChips from './conjurationListFilterChips.vue';
import ToggleCondensedView from '@/modules/core/components/buttons/toggleCondensedView.vue';
import HorizontalLoader from '@/modules/core/components/loaders/horizontalLoader.vue';
import { Sparkles } from 'lucide-vue-next';
import { useConjurationStore } from '../../store/conjuration.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const route = useRoute();
const { conjurationListFilters, conjurationListFlags, conjurationListLoading } =
  storeToRefs(useConjurationStore());
const { getConjurations } = useConjurationStore();

watch(
  () => conjurationListFilters,
  async () => {
    await getConjurations({
      offset: 0,
      limit: 25,
      ...conjurationListFilters.value,
      ...conjurationListFlags.value,
    });
  },
  { deep: true },
);
</script>

<template>
  <div>
    <div class="flex items-center gap-2 mb-2">
      <ConjurationListSearch />
      <ConjurationListFilter />
      <div>
        <router-link :to="`/conjure?from=${route.path}`" class="flex">
          <button class="button-gradient flex self-center">
            <Sparkles class="mr-2 h-5 w-5 self-center" />
            <span class="self-center">Create</span>
          </button>
        </router-link>
      </div>
      <div>
        <ToggleCondensedView />
      </div>
    </div>
    <HorizontalLoader v-model="conjurationListLoading" />
    <ConjurationListFilterChips />
  </div>
</template>
