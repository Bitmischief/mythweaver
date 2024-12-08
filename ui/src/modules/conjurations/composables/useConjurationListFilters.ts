import { ref, watch } from 'vue';
import {
  useConjurationStore,
  defaultFilters,
} from '@/modules/conjurations/store/conjuration.store.ts';
import { storeToRefs } from 'pinia';

export function useConjurationListFilters() {
  const showFilters = ref(false);
  const { conjurationListFilters } = storeToRefs(useConjurationStore());
  const filtersApplied = ref(
    JSON.stringify(conjurationListFilters.value) !== JSON.stringify(defaultFilters),
  );

  watch(
    () => conjurationListFilters.value,
    () => {
      filtersApplied.value =
        JSON.stringify(conjurationListFilters.value) !== JSON.stringify(defaultFilters);
    },
    { deep: true },
  );

  return {
    filtersApplied,
    showFilters,
  };
}
