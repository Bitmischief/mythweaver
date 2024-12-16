<script setup lang="ts">
import { useEditImage } from '@/modules/images/composables/useEditImage.ts';
import { useImageHistory } from '../../composables/useImageHistory';

const { setPrimaryImage } = useEditImage();
const { showModal, imageHistory } = useImageHistory();

function handleSetPrimaryImage(imageId: number) {
  showModal.value = false;
  setPrimaryImage(imageId);
}
</script>

<template>
  <div class="mb-4">Select from image history</div>
  <div
    class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
  >
    <div
      v-for="(img, i) in imageHistory"
      :key="`img_history_${i}`"
      class="relative group/image mx-4 md:mx-0"
    >
      <img
        :src="img.uri"
        alt="image"
        class="rounded-[20px] group-hover/image:opacity-50"
      />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/image:block"
      >
        <button class="button-gradient" @click="handleSetPrimaryImage(img.id)">
          Set as primary image
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
