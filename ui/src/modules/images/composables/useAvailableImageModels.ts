import { computed, onMounted, ref } from "vue";
import { ImageModel } from "@/modules/images/types/imageModel";
import { fetchImageModels } from "@/modules/images/api/imageModels";
import { showError } from "@/lib/notifications";

export function useAvailableImageModels() {
  const availableImageModels = ref<ImageModel[]>([]);
  const imageModelsLoaded = ref(false);

  onMounted(async() => {
    try {
      const imageModelsResponse = await fetchImageModels();
      availableImageModels.value = imageModelsResponse.data.data;
      imageModelsLoaded.value = true;
    } catch(err) {
      showError({ message: 'Encountered an error loading image models!' });
    }
  });

  const defaultImageModel = computed(() => availableImageModels.value.find(im => im.default));

  return { availableImageModels, imageModelsLoaded, defaultImageModel };
}