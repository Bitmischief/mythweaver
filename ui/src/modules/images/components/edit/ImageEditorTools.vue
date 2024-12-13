<script setup lang="ts">
import { useImageStore } from '@/modules/images/store/image.store';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';
import Inpaint from '@/modules/images/components/edit/Inpaint.vue';
import Extend from '@/modules/images/components/edit/Extend.vue';
import Erase from '@/modules/images/components/edit/Erase.vue';

const { selectedImage } = storeToRefs(useImageStore());
const { selectedTool } = storeToRefs(useImageEditorStore());
</script>

<template>
  <div
    v-if="selectedImage"
    class="px-4 lg:w-[18em] lg:shrink-0 overflow-y-auto mb-4"
  >
    <Inpaint v-if="selectedTool === 'inpaint'" :image-id="selectedImage.id" />
    <Extend v-if="selectedTool === 'outpaint'" :image-id="selectedImage.id" />
    <Erase v-if="selectedTool === 'erase'" :image-id="selectedImage.id" />
  </div>
</template>
