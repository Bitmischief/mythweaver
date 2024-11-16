<script setup lang="ts">
import { ref } from 'vue';
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
        <button
          :disabled="!selectedImageId"
          :class="[
            'rounded-md px-3 py-1 text-neutral-800',
            selectedImageId
              ? 'bg-green-500'
              : 'bg-green-500/50 cursor-not-allowed',
          ]"
        >
          Insert Image
        </button>
      </div>
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="image in generatedImages"
          :key="image.id"
          class="space-y-2 overflow-y-scroll"
        >
          <div class="flex justify-between p-1">
            <h3 class="text-md text-neutral-400 font-medium">
              {{ getModelName(image.modelId) }}
            </h3>
            <div class="flex gap-4">
              <Pencil
                class="w-5 h-5 text-neutral-400 hover:text-neutral-500 cursor-pointer self-center"
              />
              <input
                type="checkbox"
                :checked="selectedImageId === image.id"
                @change="
                  selectedImageId =
                    selectedImageId === image.id ? null : image.id
                "
                class="w-6 h-6 bg-neutral-800 border-neutral-700 rounded text-green-500 cursor-pointer self-center"
              />
            </div>
          </div>
          <div
            v-if="image.generating"
            class="h-[22rem] w-full bg-neutral-800 rounded-lg animate-pulse flex"
          >
            <div class="m-auto self-center text-neutral-500">conjuring...</div>
          </div>
          <img
            v-else
            :key="image.id"
            :src="image.uri"
            class="object-contain rounded-lg max-h-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>
