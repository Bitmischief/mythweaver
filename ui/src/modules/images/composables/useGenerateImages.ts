import { ref, computed, onUnmounted, watch } from 'vue';
import { apiGenerateImages } from '../api/images';
import { GenerateImageForm } from '../types/generateImageForm';
import { useAvailableAspectRatios } from './useAvailableAspectRatios';
import { useWebsocketChannel } from '@/lib/hooks';
import { ServerEvent } from '@/lib/serverEvents';
import { NewImageResponse } from '../types/newImageResponse';
import { Image } from '../types/image';
import { ChangeImageContextLink } from '../types/changeImageContext';
import { PresetImageSettings } from '../types/presetImageSettings';

const showModal = ref(false);

interface GenerateImagesState {
  images: Image[];
  loading: boolean;
  linkingContext?: ChangeImageContextLink;
  presetSettings?: PresetImageSettings;
}

const state = ref<GenerateImagesState>({
  images: [],
  loading: false,
});

function createWebsocketHandlers(updateState: (updates: Partial<GenerateImagesState>) => void) {
  function handleImageCreated(event: NewImageResponse) {
    const { images } = state.value;
    const existingImageIndex = images.findIndex((i) => i.id === event.image.id);

    if (existingImageIndex !== -1) {
      const updatedImage: Image = {
        ...images[existingImageIndex],
        ...event.image,
        uri: event.image.uri || '',
        generating: false,
        modelName: event.modelName || 'Unknown Model',
        prompt: event.image.prompt || '',
        edits: event.image.edits || [],
        error: false,
        errorMessage: '',
      };

      state.value.images = [
        ...images.slice(0, existingImageIndex),
        updatedImage,
        ...images.slice(existingImageIndex + 1),
      ];
    } else {
      const newImage: Image = {
        ...event.image,
        uri: event.image.uri || '',
        generating: false,
        modelName: event.modelName || 'Unknown Model',
        prompt: event.image.prompt || '',
        edits: event.image.edits || [],
        error: false,
        errorMessage: '',
      };
      state.value.images = [...images, newImage];
    }

    if (state.value.images.every((i) => !i.generating)) {
      updateState({ loading: false });
    }
  }

  function handleImageFiltered(event: any) {
    updateImageInState(event.context.imageId, {
      generating: false,
      error: true,
      errorMessage: event.description || 'An error occurred during generation',
    });

    const { images } = state.value;
    if (images.every((i) => !i.generating)) {
      updateState({ loading: false });
    }
  }

  function handleImageGenerationTimeout(imageId: number) {
    updateImageInState(imageId, {
      generating: false,
      error: true,
      errorMessage: 'Image generation timed out, please try again.',
    });
  }

  function handleImageGenerationError(imageId: number) {
    updateImageInState(imageId, {
      generating: false,
      error: true,
      errorMessage: 'There was an error generating this image, please try again.',
    });
  }

  function handleImageGenerationUpdate(event: any) {
    console.log('Received image generation update:', event);
    for (const imageId of event.imageIds) {
      console.log('Updating image status:', { imageId, status: event.status });
      updateImageInState(imageId, {
        status: event.status,
      });
    }
  }

  function updateImageInState(imageId: number, update: Partial<Image>) {
    const { images } = state.value;
    const existingImageIndex = images.findIndex((i) => i.id === imageId);
    if (existingImageIndex !== -1) {
      state.value.images = [
        ...images.slice(0, existingImageIndex),
        { ...images[existingImageIndex], ...update },
        ...images.slice(existingImageIndex + 1),
      ];
    }
  }

  return {
    handleImageCreated,
    handleImageFiltered,
    handleImageGenerationTimeout,
    handleImageGenerationError,
    handleImageGenerationUpdate,
  };
}

export function useGenerateImages() {
  const { getWidthAndHeight } = useAvailableAspectRatios();
  const channel = useWebsocketChannel();

  function updateState(updates: Partial<GenerateImagesState>) {
    state.value = {
      ...state.value,
      ...updates,
    };
  }

  const {
    handleImageCreated,
    handleImageFiltered,
    handleImageGenerationTimeout,
    handleImageGenerationError,
    handleImageGenerationUpdate,
  } = createWebsocketHandlers(updateState);

  function setupWebsocketListeners() {
    cleanupWebsocketListeners();
    channel.bind(ServerEvent.ImageCreated, handleImageCreated);
    channel.bind(ServerEvent.ImageFiltered, handleImageFiltered);
    channel.bind(ServerEvent.ImageGenerationTimeout, handleImageGenerationTimeout);
    channel.bind(ServerEvent.ImageGenerationTimeout, handleImageGenerationError);
    console.log('binding image generation update');
    channel.bind(ServerEvent.ImageGenerationUpdate, handleImageGenerationUpdate);
  }

  function cleanupWebsocketListeners() {
    channel.unbind(ServerEvent.ImageCreated, handleImageCreated);
    channel.unbind(ServerEvent.ImageFiltered, handleImageFiltered);
    channel.unbind(ServerEvent.ImageGenerationTimeout, handleImageGenerationTimeout);
    channel.unbind(ServerEvent.ImageGenerationTimeout, handleImageGenerationError);
    channel.unbind(ServerEvent.ImageGenerationUpdate, handleImageGenerationUpdate);
  }

  function setLinkingContext(context: ChangeImageContextLink) {
    updateState({ linkingContext: context });
  }

  function setPresetImageSettings(settings: PresetImageSettings) {
    updateState({ presetSettings: settings });
  }

  watch(showModal, () => {
    clearGeneratedImages();
  });

  function clearGeneratedImages() {
    updateState({ images: [] });
  }

  async function generateRequest(form: GenerateImageForm, retryImageId?: number) {
    const { width, height } = getWidthAndHeight(form.aspectRatio);

    return apiGenerateImages({
      selectedModels: form.selectedModels,
      prompt: form.prompt,
      width,
      height,
      negativePrompt: form.negativePrompt,
      referenceImageFile: form.referenceImageFile as File,
      referenceImageStrength: form.referenceImageStrength,
      linking: state.value.linkingContext,
      ...(retryImageId && { retryImageId }),
    });
  }

  async function generateImages(form: GenerateImageForm) {
    updateState({ loading: true, images: [] });
    setupWebsocketListeners();

    try {
      const newImages = await generateRequest(form);
      updateState({ images: newImages });
      return newImages;
    } catch (error) {
      updateState({ loading: false });
      cleanupWebsocketListeners();
      throw error;
    }
  }

  async function retryGeneration(form: GenerateImageForm, imageId: number) {
    updateState({ loading: true });
    setupWebsocketListeners();

    try {
      const newImage = (await generateRequest(form, imageId))[0];

      const updatedImages = [...state.value.images];
      const index = updatedImages.findIndex((img) => img.id === imageId);
      if (index !== -1 && newImage) {
        const updatedImage: Image = {
          ...newImage,
        };
        updatedImages[index] = updatedImage;
      }

      updateState({ images: updatedImages });
      return newImage;
    } catch (error) {
      updateState({ loading: false });
      cleanupWebsocketListeners();
      throw error;
    }
  }

  onUnmounted(() => {
    cleanupWebsocketListeners();
  });

  return {
    generatedImages: computed(() => state.value.images),
    loading: computed(() => state.value.loading),
    presetSettings: computed(() => state.value.presetSettings),
    showModal,
    generateImages,
    retryGeneration,
    setLinkingContext,
    setPresetImageSettings,
    clearGeneratedImages,
  };
}
