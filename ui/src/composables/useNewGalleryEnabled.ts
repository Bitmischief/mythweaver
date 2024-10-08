import { computed } from 'vue';

export function useNewGalleryEnabled() {
  const isNewGalleryEnabled = computed(() => import.meta.env.VITE_ENABLE_NEW_IMAGE_GALLERY === 'true');
  return { isNewGalleryEnabled };
}