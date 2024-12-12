<script setup lang="ts">
import { ref, computed } from 'vue';
import { Image } from '../types/image';
import { Pencil, SquareCheck, RefreshCw, RotateCw } from 'lucide-vue-next';
import { useEditImage } from '../composables/useEditImage';
import Loader from '@/components/Core/Loader.vue';
import Spinner from '@/components/Core/Spinner.vue';
import { useGenerationProgress } from '../composables/useGenerationProgress.ts';

const props = defineProps<{
  image: Image;
  allowEdits?: boolean;
  disableSetAsPrimary?: boolean;
}>();

const emit = defineEmits<{
  (e: 'primaryImageSet', imageId: number): void;
  (e: 'retryGeneration', imageId: number): void;
}>();

const { isLongRunning } = useGenerationProgress(props.image);
const { loading, setPrimaryImage, setSelectedImageById } = useEditImage();
const selected = ref(false);

const handlePrimaryImageSet = (imageId: number) => {
  emit('primaryImageSet', imageId);
  setPrimaryImage(imageId);
};

const handleRetry = () => {
  emit('retryGeneration', props.image.id);
};

const displayModelName = computed(() => {
  if (!props.image.modelId) return 'No model selected';
  return props.image.modelName || 'Loading model...';
});
</script>

<template>
  <div>
    <div class="relative">
      <div v-if="image.generating" class="h-[22rem] w-full">
        <div
          class="flex flex-col h-full flex-grow justify-center text-center bg-surface rounded-lg"
        >
          <template v-if="!image.status || image.status === 'IN_QUEUE'">
            Image queued for generation
          </template>
          <template v-else-if="image.status === 'IN_PROGRESS'">
            <Loader />
            <div class="text-xl gradient-text my-4 animate-pulse">
              Conjuring...
            </div>
          </template>
          <div
            v-if="isLongRunning && image.generating"
            class="flex flex-col items-center gap-2"
          >
            <RefreshCw class="w-5 h-5 animate-spin text-purple-500" />
            <div class="text-sm text-neutral-400">
              This image is taking longer than usual to generate.
              <br />
              Please be patient...
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="image.error" class="h-[22rem] w-full">
        <div
          class="flex flex-col h-full flex-grow justify-center text-center bg-surface rounded-lg p-2"
        >
          <div class="text-neutral-400 my-4">
            {{ image.errorMessage }}
          </div>
          <button
            class="flex items-center gap-2 px-3 py-1 mx-auto text-purple-500 hover:text-purple-400 transition-colors rounded-lg border border-purple-500 hover:border-purple-400"
            @click="handleRetry"
          >
            <RotateCw class="w-4 h-4" />
            Retry Generation
          </button>
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
        {{ displayModelName }}
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
          @click="setSelectedImageById(image.id)"
        >
          <Pencil
            class="w-5 h-5 text-neutral-200 hover:text-neutral-500 self-center"
          />
        </button>
        <button
          :disabled="disableSetAsPrimary || loading"
          class="button-gradient flex gap-2"
          @click="handlePrimaryImageSet(image.id)"
        >
          Set as primary image
          <Spinner v-if="loading" />
        </button>
      </div>
    </div>
  </div>
</template>
