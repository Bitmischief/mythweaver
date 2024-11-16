<script setup lang="ts">
import { ref } from 'vue';
import ViewImage from './ViewImage.vue';
import { useGenerateImages } from '../composables/useGenerateImages';
import { useGetModelName } from '../composables/useGetModelName';
import GenerateImageForm from './GenerateImageForm.vue';
import { Pencil } from 'lucide-vue-next';

const { generatedImages } = useGenerateImages();
const { getModelName } = useGetModelName();

const emit = defineEmits(['cancel', 'insertImage']);

const selectedImageId = ref<number | null>(null);
</script>

<template>
  <div class="md:flex w-full">
    <div class="md:w-1/3">
      <GenerateImageForm />
    </div>
    <div class="mt-8 md:mt-0 md:ml-8 w-full overflow-y-scroll">
      <div class="w-full flex justify-end gap-2">
        <button
          class="bg-neutral-800 text-neutral-500 hover:text-red-500 rounded-md px-3 py-1"
          @click="emit('cancel')"
        >
          Cancel
        </button>
      </div>
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ViewImage
          v-for="image in generatedImages"
          :key="image.id"
          :image="image"
          allow-edits
        />
      </div>
    </div>
  </div>
</template>
