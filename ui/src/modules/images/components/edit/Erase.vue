<script setup lang="ts">
import Spinner from '@/components/Core/Spinner.vue';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';

const { editing } = storeToRefs(useImageEditorStore());
const { eraseImage } = useImageEditorStore();

defineProps<{
  imageId: number;
}>();
</script>

<template>
  <div class="bg-surface rounded-3xl p-4">
    <p class="mb-4 text-neutral-400">
      Use the brush to paint over the areas you want to erase, then click
      "Erase".
    </p>
    <Button
      :disabled="editing"
      class="button-purple"
      @click="eraseImage(imageId)"
    >
      <Spinner v-if="editing" />
      {{ editing ? 'Processing...' : 'Erase' }}
    </Button>
  </div>
</template>
