<script setup lang="ts">
import FullScreenModal from '@/components/FullScreenModal.vue';
import GenerateImage from './GenerateImage.vue';
import { useGenerateImages } from '../composables/useGenerateImages';

const { showModal } = useGenerateImages();
</script>

<template>
  <FullScreenModal :show="showModal" :z="35" extra-dark>
    <div class="p-4 flex gap-4 overflow-y-none">
      <GenerateImage @cancel="showModal = false" />
    </div>
  </FullScreenModal>
</template>
