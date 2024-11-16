import { ref, watch } from 'vue';
import { getConjurationImageHistory } from '../api/imageHistory';
import { Image } from '../types/image';
import { useChangeImage } from './useChangeImage';

export function useImageHistory() {
  const { linkingContext } = useChangeImage();

  const imageHistory = ref<Image[]>([]);
  const loading = ref(false);

  watch(linkingContext, async () => {
    if (!linkingContext.value || !linkingContext.value.conjurationId) {
      return;
    }

    loading.value = true;
    imageHistory.value = await getConjurationImageHistory(linkingContext.value.conjurationId);
    loading.value = false;
  });

  return {
    imageHistory,
    loading,
  };
}
