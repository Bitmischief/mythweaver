<script setup lang="ts">
import FullScreenModal from '@/components/FullScreenModal.vue';
import { useImageHistory } from '../../composables/useImageHistory';
import ImageHistory from './ImageHistory.vue';

const { showModal } = useImageHistory();
</script>

<template>
  <FullScreenModal
    :show="showModal"
    :z="35"
    extra-dark
    @close="showModal = false"
  >
    <div class="p-4 overflow-y-none">
      <ImageHistory />
    </div>
  </FullScreenModal>
</template>
