<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import { ArrowsPointingOutIcon } from '@heroicons/vue/20/solid';
import { PencilSquareIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    imageUri: string | undefined;
    prompt?: string;
    negativePrompt?: string;
    stylePreset?: string;
    editable?: boolean;
    alt?: string;
    imageConjurationFailed?: boolean;
    imageConjurationFailureReason?: string;
    type: string;
    seed: string;
  }>(),
  {
    imageUri: undefined,
    prompt: undefined,
    negativePrompt: undefined,
    stylePreset: 'fantasy-art',
    alt: undefined,
    imageConjurationFailureReason: undefined,
    type: undefined,
    seed: undefined,
  },
);

const emit = defineEmits(['set-image']);

const eventBus = useEventBus();

onMounted(() => {
  eventBus.$on(
    'updated-conjuration-image',
    (payload: {
      imageUri: string;
      prompt: string;
      negativePrompt: string;
      stylePreset: string;
      seed: string;
    }) => {
      emit('set-image', payload);
    },
  );
});

onUnmounted(() => {
  eventBus.$off('updated-conjuration-image');
});

function showCustomizeImageModal() {
  eventBus.$emit('toggle-customize-image-modal', {
    prompt: props.prompt,
    negativePrompt: props.negativePrompt,
    stylePreset: props.stylePreset,
    imageUri: props.imageUri,
    alt: props.alt,
    seed: props.seed,
  });
}

function showImage() {
  eventBus.$emit('open-lightbox', props.imageUri);
}
</script>

<template>
  <div class="relative">
    <div class="image-badge">
      {{ type }}
    </div>

    <div v-if="editable" class="absolute flex top-2 right-2">
      <button
        class="flex button-white bg-white/50"
        :disabled="!editable"
        @click="showCustomizeImageModal"
      >
        <PencilSquareIcon class="h-4 mr-1" />
        <span class="self-center">Customize</span>
      </button>
    </div>

    <div
      v-if="imageUri"
      class="absolute flex bottom-2 right-2 cursor-pointer bg-white/50 rounded-[8px]"
      @click="showImage"
    >
      <ArrowsPointingOutIcon
        class="p-1 w-8 h-8 self-center transition-all hover:scale-125 text-black"
      />
    </div>

    <LightboxImage
      v-if="imageUri"
      :src="imageUri"
      :alt="alt"
      class="rounded-[20px]"
    />
    <div
      v-else
      class="w-full min-h-[20rem] flex justify-center h-full bg-surface"
    >
      <div
        v-if="!imageConjurationFailed"
        class="self-center text-center text-[2rem] text-white animate-pulse"
      >
        Conjuring image...
      </div>
      <div v-else class="flex">
        <div class="self-center">
          <div class="text-center text-[2rem]">Conjuration failed</div>
          <div class="text-center text-[1rem]">
            {{ imageConjurationFailureReason }}
          </div>
          <div>
            <button
              class="button-white flex mx-auto"
              @click="showCustomizeImageModal"
            >
              Retry
              <ArrowPathIcon class="w-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
