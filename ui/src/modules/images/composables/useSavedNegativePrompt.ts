import { useLocalStorage } from '@vueuse/core';

export const useSavedNegativePrompt = () => {
  const savedNegativePrompt = useLocalStorage('savedNegativePrompt', '');
  return savedNegativePrompt;
};
