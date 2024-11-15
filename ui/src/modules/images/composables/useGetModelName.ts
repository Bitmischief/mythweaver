import { useAvailableImageModels } from "./useAvailableImageModels";

export function useGetModelName() {
  const { availableImageModels } = useAvailableImageModels();

  function getModelName(modelId: number) {
    const model = availableImageModels.value.find(im => im.id === modelId);
    return model?.description || 'unknown model';
  }

  return {
    getModelName,
  }
}
