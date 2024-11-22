<script setup lang="ts">
import FullScreenModal from '@/components/FullScreenModal.vue';
import GenerateImage from './GenerateImage.vue';
import { useGenerateImages } from '../composables/useGenerateImages';

const { showModal } = useGenerateImages();
</script>

<template>
  <FullScreenModal
    :show="showModal"
    :z="35"
    extra-dark
    @close="showModal = false"
  >
    <div class="p-4 flex gap-4 overflow-y-none">
      <GenerateImage
        allow-edits
        @cancel="showModal = false"
        @primary-image-set="showModal = false"
      />
    </div>
  </FullScreenModal>
</template>
