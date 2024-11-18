import { ref } from 'vue';
import { Image } from '@/modules/images/types/image';
import { useImages } from './useImages';

const showModal = ref(false);
const selectedImage = ref<Image | null>(null);

export const useEditImage = () => {
  const { getImage } = useImages();

  const setSelectedImage = async (imageId: number) => {
    console.log('setSelectedImage', imageId);
    selectedImage.value = await getImage(imageId);
    showModal.value = true;
    console.log('setSelectedImage', selectedImage.value);
  };

  return {
    showModal,
    selectedImage,
    setSelectedImage,
  };
};
