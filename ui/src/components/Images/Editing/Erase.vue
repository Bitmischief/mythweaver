<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { smartErase } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';
import { ServerEvent } from '@/lib/serverEvents';
import { useWebsocketChannel } from '@/lib/hooks';
import { showError } from '@/lib/notifications';

const props = defineProps<{
  imageId: number;
  getMaskCanvas: () => HTMLCanvasElement | null;
}>();

const emit = defineEmits([
  'edit-applied',
  'edit-started',
  'edit-failed',
  'cancel',
]);

const isEditing = ref(false);
const channel = useWebsocketChannel();

onMounted(() => {
  channel.bind(ServerEvent.ImageEraseError, handleError);
});

onUnmounted(() => {
  channel.unbind(ServerEvent.ImageEraseError, handleError);
});

const handleError = () => {
  showError({
    message:
      'Encountered an error smart erasing image. Please contact support if this issue persists.',
  });
  isEditing.value = false;
  emit('edit-failed');
};

const applySmartErase = async () => {
  const maskCanvas = props.getMaskCanvas();
  if (!maskCanvas) return;

  isEditing.value = true;
  try {
    let maskBlob: Blob | null = null;
    try {
      maskBlob = await new Promise<Blob | null>((resolve) => {
        maskCanvas.toBlob(resolve, 'image/png');
      });
    } catch {
      return;
    }

    if (!maskBlob) {
      return;
    }

    const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

    console.log(maskFile);

    emit('edit-started');
    const editedImage = await smartErase(props.imageId, maskFile);
    emit('edit-applied', editedImage);
  } catch (error) {
    console.error('Error applying smart erase:', error);
    emit('edit-failed');
  } finally {
    isEditing.value = false;
  }
};
</script>

<template>
  <div class="bg-surface rounded-3xl p-4">
    <p class="mb-4 text-neutral-400">
      Use the brush to paint over the areas you want to erase, then click
      "Erase".
    </p>
    <Button
      :disabled="isEditing"
      class="button-purple"
      @click="applySmartErase"
    >
      <Spinner v-if="isEditing" />
      {{ isEditing ? 'Processing...' : 'Erase' }}
    </Button>
  </div>
</template>
