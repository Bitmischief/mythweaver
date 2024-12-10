import { ref, Ref } from 'vue';
import { useInfiniteScroll } from '@vueuse/core';
import { useConjurationStore } from '../store/conjuration.store';
import { storeToRefs } from 'pinia';

export function useConjurationListScroll(listWrapper: Ref<HTMLElement | null>) {
  const moreToLoad = ref(true);

  const { conjurationList, conjurationListFilters, conjurationListFlags, conjurationListLoading } =
    storeToRefs(useConjurationStore());
  const { getConjurations } = useConjurationStore();

  useInfiniteScroll(
    moreToLoad.value ? listWrapper : null,
    async () => {
      const offset = Math.ceil(conjurationList.value.length / 25) * 25;
      if (!conjurationListLoading.value && conjurationList.value.length === offset) {
        const response = await getConjurations({
          offset: offset,
          limit: 25,
          ...conjurationListFilters.value,
          ...conjurationListFlags.value,
        });

        if (response.data?.data?.length === 0) {
          moreToLoad.value = false;
        }
      } else {
        moreToLoad.value = false;
      }
    },
    {
      distance: 10,
    },
  );

  return {
    moreToLoad,
  };
}
