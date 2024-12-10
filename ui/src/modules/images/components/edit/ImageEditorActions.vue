<script setup lang="ts">
import { Download } from 'lucide-vue-next';
import { CheckIcon } from '@heroicons/vue/24/solid';
import Spinner from '@/components/Core/Spinner.vue';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { useImageStore } from '@/modules/images/store/image.store';
import { storeToRefs } from 'pinia';

const emit = defineEmits(['close']);

const { selectedImage } = storeToRefs(useImageStore());
const { editing } = storeToRefs(useImageEditorStore());

const downloadImage = async () => {
  if (!selectedImage.value || !selectedImage.value?.uri) return;

  try {
    const response = await fetch(selectedImage.value.uri);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${selectedImage.value?.id || 'download'}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
  }
};
</script>

<template>
  <div class="flex gap-2 items-center">
    <div
      v-if="!editing"
      class="hidden lg:flex gap-1 text-sm rounded-[12px] px-4 py-2 text-neutral-500"
    >
      <CheckIcon class="w-3 h-3 self-center" />
      Saved
    </div>
    <div
      v-else
      class="flex gap-1 text-sm rounded-[12px] px-4 py-2 text-neutral-500"
    >
      <Spinner class="w-3 h-3 self-center animate-spin" />
      Saving
    </div>
    <button
      class="bg-[#CC52C0]/20 hover:bg-[#CC52C0]/40 text-[#CC52C0] flex items-center px-4 py-2 rounded-full"
      :disabled="editing"
      @click="downloadImage"
    >
      <Download class="w-5 h-5 mr-2" />
      Download
    </button>
    <button
      class="button-purple rounded-full"
      :disabled="editing"
      @click="emit('close')"
    >
      Done
    </button>
  </div>
</template>
