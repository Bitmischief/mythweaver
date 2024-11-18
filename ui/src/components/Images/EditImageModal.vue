<script lang="ts" setup>
import ImageEditor from './Editing/ImageEditor.vue';
import FullScreenModal from '@/components/FullScreenModal.vue';
import { useEditImage } from '@/modules/images/composables/useEditImage';

const { showModal, selectedImage } = useEditImage();
</script>

<template>
  <FullScreenModal :show="showModal" :z="35" extra-dark>
    <ImageEditor
      v-if="selectedImage"
      :image="selectedImage"
      @close="showModal = false"
    />
  </FullScreenModal>
</template>
