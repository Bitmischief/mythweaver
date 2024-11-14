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

  const generateImages = async (form: GenerateImageForm) => {
    generatedImages.value = [];
    
    const { width, height } = getWidthAndHeight(form.aspectRatio);

    channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
    
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

    channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
  }

  return {
    generateImages,
    generatedImages,
  }
}