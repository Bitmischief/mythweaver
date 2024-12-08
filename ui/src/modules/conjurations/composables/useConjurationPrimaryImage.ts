import { computed } from 'vue';
import { Conjuration } from '../types';

export function useConjurationPrimaryImage(conjuration: Conjuration) {
  const primaryImage = computed(() => {
    if (conjuration.images?.length) {
      const primary = conjuration.images?.find((i) => i.primary === true);
      if (primary) {
        return primary;
      }
    }

    switch (conjuration.conjurerCode) {
      case 'characters':
        return { uri: '/images/conjurations/character-no-image.png' };
      case 'locations':
        return { uri: '/images/conjurations/location-no-image.png' };
      case 'monsters':
        return { uri: '/images/conjurations/monster-no-image.png' };
      case 'items':
        return { uri: '/images/conjurations/item-no-image.png' };
      case 'players':
        return { uri: '/images/conjurations/player-no-image.png' };
      default:
        return { uri: '' };
    }
  });

  return {
    primaryImage,
  };
}
