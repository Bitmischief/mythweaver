import { computed } from 'vue';
import { Conjuration } from '../types';

export const useConjurationTags = (conjuration: Conjuration) => {
  const tags = computed(() => conjuration.tags);

  return {
    tags,
  };
};
