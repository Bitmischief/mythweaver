import { ref, watch } from 'vue';
import { getConjurationImageHistory } from '../api/imageHistory';
import { Image } from '../types/image';

const showModal = ref(false);
const imageHistory = ref<Image[]>([]);
const loading = ref(false);
const conjurationId = ref<number | undefined>(undefined);

export function useImageHistory() {
  async function chooseFromImageHistory(newConjurationId: number) {
    showModal.value = true;
    conjurationId.value = newConjurationId;

    await reloadImageHistory();
  }

  async function reloadImageHistory() {
    if (!conjurationId.value) {
      return;
    }

    loading.value = true;
    imageHistory.value = await getConjurationImageHistory(conjurationId.value);
    loading.value = false;
  }

  watch(conjurationId, async () => {
    if (!conjurationId.value) {
      return;
    }

    await reloadImageHistory();
  });

  return {
    showModal,
    imageHistory,
    chooseFromImageHistory,
    loading,
  };
}
