<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  src: string;
  alt: string;
}>();

const isOpen = ref(false);

const openLightbox = () => {
  isOpen.value = true;
};

const closeLightbox = () => {
  isOpen.value = false;
};

const handleOutsideClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closeLightbox();
  }
};
</script>

<template>
  <div>
    <img 
      :src="src" 
      :alt="alt" 
      @click="openLightbox" 
      class="cursor-pointer w-full h-full object-cover"
    />
    <div v-if="isOpen" 
         class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
         @click="handleOutsideClick">
      <div class="max-w-4xl w-full rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div class="flex flex-col overflow-y-auto relative">
          <button @click="closeLightbox" class="absolute top-2 right-2 text-white hover:text-gray-200 text-2xl z-10">&times;</button>
          <img :src="src" :alt="alt" class="w-full h-[75vh] object-contain" />
          <div class="overflow-y-auto text-white bg-black bg-opacity-75 p-6 rounded-b-lg">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
