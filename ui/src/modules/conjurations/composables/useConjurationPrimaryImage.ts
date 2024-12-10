import { computed } from 'vue';
import { Conjuration } from '../types';
import { mapNoImage } from '@/lib/util';

export function useConjurationPrimaryImage(conjuration: Conjuration) {
  const primaryImage = computed(() => {
    if (conjuration.images?.length) {
      const primary = conjuration.images?.find((i) => i.primary === true);
      if (primary) {
        return primary;
      }
    }

    return mapNoImage(conjuration.conjurerCode);
  });

  return {
    primaryImage,
  };
}
