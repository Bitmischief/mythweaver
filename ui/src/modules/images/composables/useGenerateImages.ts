import { ref } from "vue";
import { apiGenerateImages } from "../api/images";
import { GenerateImageForm } from "../types/generateImageForm";
import { useAvailableAspectRatios } from "./useAvailableAspectRatios";
import { useWebsocketChannel } from "@/lib/hooks";
import { ServerEvent } from "@/lib/serverEvents";
import { NewImageResponse } from "../types/newImageResponse";
import { GeneratedImages } from "../types/generatedImages";
import { useAvailableImageModels } from "./useAvailableImageModels";

const generatedImages = ref<GeneratedImages[]>([]);

export function useGenerateImages() {
  const { getWidthAndHeight } = useAvailableAspectRatios();
  const { availableImageModels } = useAvailableImageModels();
  const channel = useWebsocketChannel();

  const loading = ref(false);

  let requestedImageQty = 0;
  let generatedImageQty = 0;

  const generateImages = async (form: GenerateImageForm) => {
    generatedImageQty = 0;
    requestedImageQty = form.selectedModels.reduce((n, { quantity }) => n + quantity, 0);
    generatedImages.value = [];
    
    const { width, height } = getWidthAndHeight(form.aspectRatio);

    channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
    loading.value = true;

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

  function imageCreatedHandler(event: NewImageResponse) {
    console.log('called imageCreatedHandler');
    const existingModel = generatedImages.value.find(gi => gi.modelId === event.modelId);

    if (existingModel) {
      existingModel.images.push(event.image);
    } else {
      const model = availableImageModels.value.find(im => im.id === event.modelId);

      generatedImages.value.push({
        modelId: event.modelId,
        modelName: model?.description || 'unknown model',
        images: [event.image],
      });
    }

    generatedImageQty++;
    
    if (generatedImageQty >= requestedImageQty) {
      loading.value = false;
      channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
    }
  }

  return {
    generateImages,
    generatedImages,
    loading,
  }
}