<script setup lang="ts">
import { watch } from 'vue';
import ConjurationListSearch from './conjurationListSearch.vue';
import ConjurationListFilter from './conjurationListFilter.vue';
import ConjurationListFilterPreview from './conjurationListFilterPreview.vue';
import ToggleCondensedView from '@/modules/core/components/buttons/toggleCondensedView.vue';
import { Sparkles } from 'lucide-vue-next';
import { useConjurationStore } from '../../store/conjuration.store';
import { storeToRefs } from 'pinia';

const { conjurationListFilters } = storeToRefs(useConjurationStore());
const { getConjurations } = useConjurationStore();

watch(
  () => conjurationListFilters,
  async () => {
    await getConjurations({
      offset: 0,
      limit: 25,
      mine: true,
      saved: true,
      ...conjurationListFilters.value,
    });
  },
  { deep: true },
);
</script>

<template>
  <div class="mb-4">
    <div class="flex items-center gap-2">
      <ConjurationListSearch />
      <ConjurationListFilter />
      <div>
        <router-link to="/conjure" class="flex">
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
    <ConjurationListFilterPreview />
  </div>
</template>
