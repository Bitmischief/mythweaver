import { onMounted, onUnmounted, ref } from "vue";
import { apiGenerateImages } from "../api/images";
import { GenerateImageForm } from "../types/generateImageForm";
import { useAvailableAspectRatios } from "./useAvailableAspectRatios";
import { useWebsocketChannel } from "@/lib/hooks";
import { ServerEvent } from "@/lib/serverEvents";
import { Image } from "../types/image";

export function useGenerateImages() {
  const { getWidthAndHeight } = useAvailableAspectRatios();
  const channel = useWebsocketChannel();

  const generatedImages = ref<Image[]>([]);

  const generateImages = async (form: GenerateImageForm) => {
    const { width, height } = getWidthAndHeight(form.aspectRatio);

    await apiGenerateImages({
      selectedModels: form.selectedModels,
      prompt: form.prompt,
      width,
      height,
      negativePrompt: form.negativePrompt,
      referenceImageFile: form.referenceImageFile as File,
      referenceImageStrength: form.referenceImageStrength,
    });
  };

  onMounted(() => {
    channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
  });

  onUnmounted(() => {
    channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
  });

  function imageCreatedHandler(image: Image) {
    generatedImages.value.push(image);
  }

  return {
    generateImages,
    generatedImages,
  }
}