import { ref, computed } from 'vue';
import { Image } from '../types/image';
import { apiGenerateImages, apiGetImage } from '../api/images';
import { GenerateImageRequest } from '../types/generateImageRequest';
import { showError } from '@/lib/notifications';

const imageCache = ref<Map<number, Image>>(new Map());
const loadingImages = ref<Set<number>>(new Set());

export function useImages() {
  function cacheImages(images: Image | Image[]) {
    const imagesToCache = Array.isArray(images) ? images : [images];
    imagesToCache.forEach((image) => {
      imageCache.value.set(image.id, image);
    });
  }

  const getImage = async (imageId: number): Promise<Image> => {
    const cachedImage = imageCache.value.get(imageId);

    if (cachedImage) {
      return cachedImage;
    }

    return await apiGetImage(imageId);
  };

  const isImageLoading = computed(() => (imageId: number) => {
    return loadingImages.value.has(imageId);
  });

  async function generateImages(request: GenerateImageRequest): Promise<Image[]> {
    try {
      const generatedImages = await apiGenerateImages(request);
      cacheImages(generatedImages);
      return generatedImages;
    } catch (error) {
      showError({ message: 'Failed to generate images' });
      throw error;
    }
  }

  function clearImageFromCache(imageId: number) {
    imageCache.value.delete(imageId);
  }

  function clearImageCache() {
    imageCache.value.clear();
  }

  function setImageLoading(imageId: number) {
    loadingImages.value.add(imageId);
  }

  function setImageLoaded(imageId: number) {
    loadingImages.value.delete(imageId);
  }

  function updateImage(imageId: number, updates: Partial<Image>) {
    const existingImage = imageCache.value.get(imageId);
    if (existingImage) {
      imageCache.value.set(imageId, { ...existingImage, ...updates });
    }
  }

  const getAllCachedImages = computed(() => {
    return Array.from(imageCache.value.values());
  });

  return {
    getImage,
    isImageLoading,
    getAllCachedImages,
    generateImages,
    cacheImages,
    clearImageFromCache,
    clearImageCache,
    setImageLoading,
    setImageLoaded,
    updateImage,
  };
}
