import { ref } from 'vue';
import { useImages } from './useImages';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { patchPrimaryImage } from '@/api/images.ts';
import { PrimaryImageSetResponse } from '@/modules/images/types/primaryImageSetResponse.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import { useGenerateImages } from '@/modules/images/composables/useGenerateImages.ts';

const loading = ref(false);

export const useEditImage = () => {
  const channel = useWebsocketChannel();
  const imageStore = useImageStore();
  const { getImage } = useImages();
  const { generatedImages } = useGenerateImages();

  const setSelectedImageById = async (imageId: number) => {
    const image = await getImage(imageId);
    await setSelectedImage(image);
  };

  const setSelectedImage = async (image: any) => {
    imageStore.setSelectedImage(image);
    imageStore.setShowEditImageModal(true);

    if (generatedImages.value && generatedImages.value.find((i) => i.id === image.id)) {
      const existingImage = generatedImages.value.find((i) => i.id === image.id);
      if (existingImage) {
        existingImage.uri = image.uri;
      }
    }
  };

  const setPrimaryImage = async (imageId: number) => {
    loading.value = true;
    channel.bind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
    await patchPrimaryImage(imageId);
  };

  function primaryImageSetHandler(event: PrimaryImageSetResponse) {
    if (event.images.length) {
      imageStore.setSelectedImage(event.images[0]);
    }

    channel.unbind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
    loading.value = false;
  }

  return {
    loading,
    setPrimaryImage,
    setSelectedImageById,
    setSelectedImage,
  };
};
