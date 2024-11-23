import { ref, onMounted, onUnmounted } from 'vue';
import type { Image } from '../types/image';

export function useGenerationProgress(image: Image) {
  const isLongRunning = ref(false);
  const LONG_RUNNING_THRESHOLD = 30 * 1000; // 30 seconds
  let checkInterval: NodeJS.Timeout | null = null;

  function checkGenerationTime() {
    if (!image.createdAt || !image.generating) {
      return;
    }

    const createdAt = new Date(image.createdAt).getTime();
    const elapsedTime = Date.now() - createdAt;
    isLongRunning.value = elapsedTime > LONG_RUNNING_THRESHOLD;
  }

  onMounted(() => {
    if (image.generating && image.createdAt) {
      checkGenerationTime();
      checkInterval = setInterval(checkGenerationTime, 1000);
    }
  });

  onUnmounted(() => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });

  return {
    isLongRunning,
  };
}
