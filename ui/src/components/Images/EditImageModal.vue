<script lang="ts" setup>
import ImageEditor from './Editing/ImageEditor.vue';
import FullScreenModal from '@/components/FullScreenModal.vue';
import { useImageStore } from '@/modules/images/store/image.store.ts';

const imageStore = useImageStore();
</script>

<template>
  <FullScreenModal
    :show="imageStore.showEditImageModal"
    :z="35"
    extra-dark
    manually-override-close
  >
    <ImageEditor @close="imageStore.showEditImageModal = false" />
  </FullScreenModal>
</template>
