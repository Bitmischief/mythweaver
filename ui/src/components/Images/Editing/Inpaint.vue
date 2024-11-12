<script setup lang="ts">
import { ref } from 'vue';
import { inpaintImage } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';
import { FormKit } from '@formkit/vue';

const emit = defineEmits([
  'edit-applied',
  'edit-started',
  'edit-failed',
  'cancel',
]);

const props = defineProps<{
  imageId: number;
  getMaskCanvas: () => HTMLCanvasElement | null;
}>();

const prompt = ref<string>();
const isEditing = ref<boolean>(false);

const applyEdit = async () => {
  const maskCanvas = props.getMaskCanvas();
  if (!maskCanvas || !prompt.value || !prompt.value.trim()) return;

  isEditing.value = true;

  try {
    const maskBlob = await new Promise<Blob | null>((resolve) => {
      maskCanvas.toBlob(resolve, 'image/png');
    });

    if (!maskBlob) {
      throw new Error('Failed to create mask blob');
    }

    const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' });

    emit('edit-started');
    const editedImage = await inpaintImage(
      props.imageId,
      maskFile,
      prompt.value,
    );
    emit('edit-applied', editedImage);
  } catch (error) {
    console.error('Error applying inpainting:', error);
    emit('edit-failed');
  } finally {
    isEditing.value = false;
  }
};
</script>

<template>
  <div>
    <div class="mb-4">
      <FormKit
        id="inpaintPrompt"
        v-model="prompt"
        type="textarea"
        :rows="3"
        label="Prompt:"
        placeholder="Enter a prompt (e.g. clenched fists, leather armor)"
        validation="required"
        :validation-messages="{
          required: 'Please enter a prompt'
        }"
        input-class="text-sm w-full bg-neutral-900 border border-zinc-600 rounded"
      />
    </div>
    <FormKit
      type="submit"
      :disabled="isEditing || !prompt"
      input-class="button-ghost w-full flex justify-center gap-2"
      @click="applyEdit"
    >
      <Spinner v-if="isEditing" />
      {{ isEditing ? 'Processing...' : 'Apply Inpainting' }}
    </FormKit>
  </div>
</template>
