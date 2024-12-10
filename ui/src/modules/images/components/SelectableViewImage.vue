<script setup lang="ts">
import { ref, computed } from 'vue';
import { Image } from '../types/image.ts';
import { Pencil, CheckCircle } from 'lucide-vue-next';
import { useEditImage } from '../composables/useEditImage.ts';
import Spinner from '@/components/Core/Spinner.vue';
import { useImageStore } from '../store/image.store.ts';

defineProps<{
  image: Image;
  allowEdits?: boolean;
  disableSetAsPrimary?: boolean;
}>();

const loading = ref(false);
const imageStore = useImageStore();
const { setPrimaryImage, setSelectedImageById } = useEditImage();
const selectedImageId = computed(() => {
  return imageStore.selectedImage?.id;
});
</script>

<template>
  <div>
    <ViewImage :image="image" :allow-edits="allowEdits" />

    <div v-if="!image.generating">
      <div class="flex justify-end gap-4 py-2">
        <button
          v-if="allowEdits"
          class="button-primary cursor-pointer"
          @click="setSelectedImageById(image.id)"
        >
          <Pencil
            class="w-5 h-5 text-neutral-200 hover:text-neutral-500 self-center"
          />
        </button>
        <button
          v-if="image.id !== selectedImageId"
          :disabled="disableSetAsPrimary || loading"
          class="button-gradient flex gap-2"
          @click="setPrimaryImage(image.id)"
        >
          Set as primary image
          <Spinner v-if="loading" />
        </button>
        <div v-else class="button-primary opacity-75 flex items-center gap-2">
          Primary Image Set
          <CheckCircle />
        </div>
      </div>
    </div>
  </div>
</template>
