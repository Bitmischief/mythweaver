import { ref } from "vue";
import { apiGenerateImages } from "../api/images";
import { GenerateImageForm } from "../types/generateImageForm";
import { useAvailableAspectRatios } from "./useAvailableAspectRatios";
import { useWebsocketChannel } from "@/lib/hooks";
import { ServerEvent } from "@/lib/serverEvents";
import { NewImageResponse } from "../types/newImageResponse";
import { Image } from "../types/image";

const generatedImages = ref<Image[]>([]);

export function useGenerateImages() {
  const { getWidthAndHeight } = useAvailableAspectRatios();
  const channel = useWebsocketChannel();

  const loading = ref(false);

  const generateImages = async (form: GenerateImageForm) => {
    generatedImages.value = [];
    
    const { width, height } = getWidthAndHeight(form.aspectRatio);

    channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
    loading.value = true;

    generatedImages.value = await apiGenerateImages({
      selectedModels: form.selectedModels,
      prompt: form.prompt,
      width,
      height,
      negativePrompt: form.negativePrompt,
      referenceImageFile: form.referenceImageFile as File,
      referenceImageStrength: form.referenceImageStrength,
    });
  };

  function imageCreatedHandler(event: NewImageResponse) {
    console.log('imageCreatedHandler', event);
    console.log('generatedImages', generatedImages.value);
    const existingImage = generatedImages.value.find(i => i.id === event.image.id);
    if (existingImage) {
      existingImage.uri = event.image.uri;
      existingImage.generating = false;
    } else {
      generatedImages.value.push(event.image);
    }

    if (generatedImages.value.every(i => !i.generating)) {
      channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
      loading.value = false;
    }
  }

  return {
    generateImages,
    generatedImages,
    loading,
  }
}