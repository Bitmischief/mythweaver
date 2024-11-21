<script setup lang="ts">
import { ref } from 'vue';
import { smartErase } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';
import { FormKit } from '@formkit/vue';

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
const error = ref<string | null>(null);

const applySmartErase = async () => {
  const maskCanvas = props.getMaskCanvas();
  console.log(maskCanvas);
  if (!maskCanvas) {
    return;
  }

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
    <p v-if="error">
      {{ error }}
    </p>
    <FormKit
      type="submit"
      :disabled="isEditing"
      input-class="$reset button-purple w-full"
      @click="applySmartErase"
    >
      <Spinner v-if="isEditing" />
      {{ isEditing ? 'Processing...' : 'Erase' }}
    </FormKit>
  </div>
</template>
