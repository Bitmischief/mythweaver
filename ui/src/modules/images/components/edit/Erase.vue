<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import Spinner from '@/components/Core/Spinner.vue';
import { ServerEvent } from '@/lib/serverEvents';
import { useWebsocketChannel } from '@/lib/hooks';
import { showError } from '@/lib/notifications';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';

const { editing } = storeToRefs(useImageEditorStore());
const { eraseImage } = useImageEditorStore();

const props = defineProps<{
  imageId: number;
}>();

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
};

const applySmartErase = async () => {
  try {
    await eraseImage(props.imageId);
  } catch (error) {
    console.error('Error applying smart erase:', error);
  }
};
</script>

<template>
  <div class="bg-surface rounded-3xl p-4">
    <p class="mb-4 text-neutral-400">
      Use the brush to paint over the areas you want to erase, then click
      "Erase".
    </p>
    <Button :disabled="editing" class="button-purple" @click="applySmartErase">
      <Spinner v-if="editing" />
      {{ editing ? 'Processing...' : 'Erase' }}
    </Button>
  </div>
</template>
