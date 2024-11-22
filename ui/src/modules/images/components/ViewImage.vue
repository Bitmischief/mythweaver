<script setup lang="ts">
import { ref, computed } from 'vue';
import { Image } from '../types/image';
import { Pencil, SquareCheck, CheckCircle } from 'lucide-vue-next';
import { useEditImage } from '../composables/useEditImage';
import Loader from '@/components/Core/Loader.vue';
import Spinner from '@/components/Core/Spinner.vue';
import { useImageStore } from '../store/image.store.ts';

defineProps<{
  image: Image;
  allowEdits?: boolean;
  disableSetAsPrimary?: boolean;
}>();

const emit = defineEmits<{
  (e: 'primaryImageSet', imageId: number): void;
}>();

const imageStore = useImageStore();
const { loading, setPrimaryImage, setSelectedImage } = useEditImage();
const selected = ref(false);
const selectedImageId = computed(() => {
  return imageStore.selectedImage?.id;
});

const handlePrimaryImageSet = (imageId: number) => {
  emit('primaryImageSet', imageId);
  setPrimaryImage(imageId);
};
</script>

<template>
  <div>
    <div class="relative">
      <div v-if="image.generating" class="h-[22rem] w-full">
        <div
          class="flex flex-col h-full flex-grow justify-center text-center bg-surface rounded-lg"
        >
          <Loader />
          <div class="text-xl gradient-text my-4 animate-pulse">
            Conjuring...
          </div>
        </div>
      </div>
      <div v-else-if="image.error" class="h-[22rem] w-full">
        <div
          class="flex flex-col h-full flex-grow justify-center text-center bg-surface rounded-lg p-2"
        >
          <div class="text-neutral-400 my-4">
            {{ image.errorMessage }}
            Please try again.
          </div>
        </div>
      </div>
      <img
        v-else
        :key="image.id"
        :src="image.uri"
        class="object-contain rounded-lg max-h-full"
        :class="{
          'border-4 border-purple-500': selected,
          'cursor-pointer': true,
        }"
      />
      <div
        v-if="!image.generating"
        class="absolute bg-neutral-900/75 px-2 rounded-full bottom-2 right-2"
      >
        {{ image.modelName }}
      </div>
      <SquareCheck
        v-if="!image.generating && selected"
        class="h-8 w-8 absolute top-2 right-2 text-purple-500 bg-neutral-800 rounded"
      />
    </div>

    <div v-if="!image.generating && !image.error">
      <div class="flex justify-end gap-4 py-2">
        <button
          v-if="allowEdits"
          class="button-primary cursor-pointer"
          @click="setSelectedImage(image.id)"
        >
          <Pencil
            class="w-5 h-5 text-neutral-200 hover:text-neutral-500 self-center"
          />
        </button>
        <button
          v-if="image.id !== selectedImageId"
          :disabled="disableSetAsPrimary || loading"
          class="button-gradient flex gap-2"
          @click="handlePrimaryImageSet(image.id)"
        >
          Set as primary image
          <Spinner v-if="loading" />
        </button>
        <div v-else class="button-primary opacity-75 flex items-center gap-2">
          Primary Image Set
          <CheckCircle />
        </div>
      </div>
    </div>
  </div>
</template>
