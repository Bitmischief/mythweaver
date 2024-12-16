import { ref, watch } from 'vue';
import {
  useConjurationStore,
  getDefaultFilters,
} from '@/modules/conjurations/store/conjuration.store.ts';
import { storeToRefs } from 'pinia';

const showFilters = ref(false);

export function useConjurationListFilters() {
  const { conjurationListFilters } = storeToRefs(useConjurationStore());
  const filtersApplied = ref(
    JSON.stringify(conjurationListFilters.value) !== JSON.stringify(getDefaultFilters()),
  );

  watch(
    () => conjurationListFilters.value,
    () => {
      filtersApplied.value =
        JSON.stringify(conjurationListFilters.value) !== JSON.stringify(getDefaultFilters());
    },
    { deep: true },
  );

  return {
    filtersApplied,
    showFilters,
  };
}
