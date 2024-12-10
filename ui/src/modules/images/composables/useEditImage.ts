import { useImages } from './useImages';
import { patchPrimaryImage } from '@/api/images.ts';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import { useGenerateImages } from '@/modules/images/composables/useGenerateImages.ts';

export const useEditImage = () => {
  const imageStore = useImageStore();
  const { getImage } = useImages();
  const { generatedImages } = useGenerateImages();

  const setSelectedImageById = async (imageId: number) => {
    const image = await getImage(imageId);
    await setSelectedImage(image);
  };

  const setSelectedImage = async (image: any) => {
    imageStore.selectedImage = image;
    imageStore.setShowEditImageModal(true);

    if (generatedImages.value && generatedImages.value.find((i) => i.id === image.id)) {
      const existingImage = generatedImages.value.find((i) => i.id === image.id);
      if (existingImage) {
        existingImage.uri = image.uri;
      }
    }
  };

  const setPrimaryImage = async (imageId: number) => {
    await patchPrimaryImage(imageId);
  };

  return {
    setPrimaryImage,
    setSelectedImageById,
    setSelectedImage,
  };
};
