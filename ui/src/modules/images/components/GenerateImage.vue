<script setup lang="ts">
import { useGenerateImages } from '../composables/useGenerateImages';
import GenerateImageForm from './GenerateImageForm.vue';

const { generatedImages } = useGenerateImages();
</script>

<template>
  <div class="md:flex w-full">
    <div class="md:w-1/3">
      <GenerateImageForm />
    </div>
    <div class="mt-8 md:mt-0 md:ml-8 w-full overflow-y-scroll">
      <!-- <div class="w-full flex justify-end gap-2">
        <button class="bg-neutral-800 text-neutral-500 hover:text-red-500 rounded-md px-3 py-1">Cancel</button>
        <button class="bg-green-500 rounded-md px-3 py-1 text-neutral-800">Select Image</button>
      </div> -->
      <div v-for="model in generatedImages" :key="model.modelId" class="space-y-2  overflow-y-scroll">
        <h3 class="text-lg font-medium">{{ model.modelName }}</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <img 
            v-for="image in model.images" 
            :key="image.id" 
            :src="image.uri"
            class="object-contain rounded-lg max-h-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>