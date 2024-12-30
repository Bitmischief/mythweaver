import { computed } from 'vue';
import { Conjuration } from '../types';
import { mapNoImage } from '@/lib/util';

export function useConjurationPrimaryImage(conjuration: Conjuration | undefined = undefined) {
  const primaryImage = computed(() => {
    return getPrimaryImage(conjuration);
  });

  const getPrimaryImage = (c: Conjuration | undefined) => {
    if (c?.images?.length) {
      const primary = c.images?.find((i) => i.primary === true);
      if (primary) {
        return primary;
      }
    }

    return {
      uri: mapNoImage(c?.conjurerCode ?? ''),
    };
  };

  const hasAnyPrimaryImages = computed(() => {
    return conjuration?.images?.some((i) => i.primary === true);
  });

  return {
    primaryImage,
    hasAnyPrimaryImages,
    getPrimaryImage,
  };
}
