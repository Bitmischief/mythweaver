<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import { ArrowsPointingOutIcon } from '@heroicons/vue/20/solid';
import {
  PencilSquareIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onUnmounted } from 'vue';
import { showError } from '@/lib/notifications.ts';

const props = withDefaults(
  defineProps<{
    imageId: string | null | undefined;
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
    linking?: {
      sessionId?: number;
      characterId?: number;
      conjurationId?: number;
    };
  }>(),
  {
    imageId: undefined,
    imageUri: undefined,
    prompt: undefined,
    negativePrompt: undefined,
    stylePreset: 'fantasy-art',
    alt: undefined,
    imageConjurationFailureReason: undefined,
    type: undefined,
    seed: undefined,
    linking: undefined,
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
    imageId: props.imageId,
    linking: props.linking,
  });
}

function showImage() {
  eventBus.$emit('open-lightbox', props.imageUri);
}

function downloadImage(url: string) {
  fetch(url)
    .then((resp) => resp.blob())
    .then((blobobject) => {
      const blob = window.URL.createObjectURL(blobobject);
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = blob;
      anchor.download = `${props.alt?.toLowerCase()}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(blob);
    })
    .catch(() => showError({ message: 'Failed to download image' }));
}
</script>

<template>
  <div class="relative">
    <div class="image-badge">
      {{ type }}
    </div>

    <div v-if="editable" class="absolute flex top-2 right-2">
      <button
        type="button"
        class="flex button-white bg-white/50"
        :disabled="!editable"
        @click="showCustomizeImageModal"
      >
        <PencilSquareIcon class="h-5 mr-1" />
        <span class="self-center">Customize</span>
      </button>
      <div class="relative group ml-2">
        <button
          v-if="imageUri"
          type="button"
          class="flex button-white bg-white/50 mr-1"
          @click="downloadImage(imageUri)"
        >
          <ArrowDownTrayIcon class="h-5 w-5" />
        </button>
        <div
          class="absolute mt-2 top-[100%] right-0 hidden group-hover:block whitespace-nowrap px-2 py-1 bg-surface-3 rounded-full"
        >
          Download Image
        </div>
      </div>
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
        class="self-center text-center text-[2rem] text-white"
      >
        <span v-if="type !== 'Character'" class="animate-pulse"
          >Conjuring image...</span
        >
        <span v-else>No Image</span>
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
