import { onMounted, ref } from 'vue';
import { apiGenerateImages } from '../api/images';
import { GenerateImageForm } from '../types/generateImageForm';
import { useAvailableAspectRatios } from './useAvailableAspectRatios';
import { useWebsocketChannel } from '@/lib/hooks';
import { ServerEvent } from '@/lib/serverEvents';
import { NewImageResponse } from '../types/newImageResponse';
import { Image } from '../types/image';
import { ChangeImageContextLink } from '../types/changeImageContext';

const showModal = ref(false);
const generatedImages = ref<Image[]>([]);
const linkingContext = ref<ChangeImageContextLink | undefined>(undefined);

export function useGenerateImages() {
  const { getWidthAndHeight } = useAvailableAspectRatios();
  const channel = useWebsocketChannel();

  const loading = ref(false);

  onMounted(() => {
    generatedImages.value = [];
  });

  function setLinkingContext(context: ChangeImageContextLink) {
    linkingContext.value = context;
  }

  async function generateImages(form: GenerateImageForm) {
    generatedImages.value = [];

    const { width, height } = getWidthAndHeight(form.aspectRatio);

    channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
    channel.bind(ServerEvent.ImageFiltered, imageFilteredHandler);
    loading.value = true;

    generatedImages.value = await apiGenerateImages({
      selectedModels: form.selectedModels,
      prompt: form.prompt,
      width,
      height,
      negativePrompt: form.negativePrompt,
      referenceImageFile: form.referenceImageFile as File,
      referenceImageStrength: form.referenceImageStrength,
      linking: {
        ...linkingContext.value,
      },
    });
  }

  function imageCreatedHandler(event: NewImageResponse) {
    const existingImage = generatedImages.value.find((i) => i.id === event.image.id);
    if (existingImage) {
      existingImage.uri = event.image.uri;
      existingImage.generating = false;
      existingImage.modelName = event.modelName;
    } else {
      generatedImages.value.push(event.image);
    }

    if (generatedImages.value.every((i) => !i.generating)) {
      channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
      loading.value = false;
    }
  }

  function imageFilteredHandler(event: any) {
    const existingImage = generatedImages.value.find((i) => i.id === event.context.imageId);
    if (existingImage) {
      existingImage.generating = false;
      existingImage.error = true;
      existingImage.errorMessage = event.description;
    }

    if (generatedImages.value.every((i) => !i.generating)) {
      channel.unbind(ServerEvent.ImageFiltered, imageFilteredHandler);
      loading.value = false;
    }
  }

  return {
    showModal,
    setLinkingContext,
    generateImages,
    generatedImages,
    loading,
  };
}
