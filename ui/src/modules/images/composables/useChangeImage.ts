import { ref } from 'vue';
import { ChangeImageContext, ChangeImageContextLink } from '../types/changeImageContext';

const showModal = ref(false);
const currentImageId = ref<number | undefined>(undefined);
const linkingContext = ref<ChangeImageContextLink | undefined>(undefined);

export function useChangeImage() {
  function changeImage(context: ChangeImageContext) {
    currentImageId.value = context.currentImageId;
    linkingContext.value = context.link;

    showModal.value = true;
  }

  return {
    showModal,
    currentImageId,
    linkingContext,
    changeImage,
  };
}
