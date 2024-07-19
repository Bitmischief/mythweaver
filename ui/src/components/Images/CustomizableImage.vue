<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import {
  PencilSquareIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/vue/24/outline';
import { useEventBus } from '@/lib/events.ts';
import { showError } from '@/lib/notifications.ts';
import { computed, onMounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    image?: {
      id?: string | null | undefined;
      uri: string | undefined;
      prompt?: string;
      negativePrompt?: string;
      stylePreset?: string;
      seed?: string;
      imageModel?: {
        description?: string;
      };
      generating?: boolean;
      failed?: boolean;
    };
    editable?: boolean;
    alt?: string;
    imageConjurationFailed?: boolean;
    imageConjurationFailureReason?: string;
    type: string;
    linking?: {
      sessionId?: number;
      characterId?: number;
      conjurationId?: number;
    };
  }>(),
  {
    image: () => ({
      id: undefined,
      uri: undefined,
      prompt: undefined,
      negativePrompt: undefined,
      stylePreset: 'fantasy-art',
      seed: undefined,
      imageModel: {
        description: '',
      },
      generating: false,
      failed: false,
    }),
    alt: undefined,
    imageConjurationFailureReason: undefined,
    type: undefined,
    linking: undefined,
  },
);

const eventBus = useEventBus();
const imgWidth = ref(0);
const imgHeight = ref(0);

onMounted(() => {
  setImgDimensions();
});

function showCreateImageModal() {
  eventBus.$emit('toggle-customize-image-modal', {
    image: {
      ...props.image,
      uri: undefined,
    },
    alt: props.alt,
    linking: props.linking,
  });
}

function showCustomizeImageModal() {
  eventBus.$emit('toggle-customize-image-modal', {
    image: props.image,
    alt: props.alt,
    linking: props.linking,
  });
}

function setImgDimensions() {
  if (props.image.uri) {
    const img = new Image();
    img.onload = () => {
      imgWidth.value = img.width;
      imgHeight.value = img.height;
    };
    img.src = props.image.uri;
  }
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

const alreadyUpscaled = computed(() => {
  return imgWidth.value > 1024 || imgHeight.value > 1024;
});
</script>

<template>
  <div class="relative">
    <div class="relative">
      <div
        v-if="image.imageModel?.description"
        class="absolute flex bottom-2 right-2 cursor-pointer bg-neutral-500/50 rounded-[8px]"
      >
        <div class="text-neutral-300 text-sm px-2">
          {{ image.imageModel?.description }}
        </div>
      </div>

      <LightboxImage
        v-if="image.uri"
        :src="image.uri"
        :alt="alt"
        class="rounded-[20px]"
      />
      <div v-else class="w-full flex justify-center h-full bg-surface">
        <div
          v-if="!image.failed"
          class="self-center text-center text-[2rem] text-white"
        >
          <span v-if="type !== 'Character'" class="animate-pulse"
            >Conjuring image...</span
          >
          <span v-else>No Image</span>
        </div>
        <div v-else-if="editable" class="flex my-[150px]">
          <div class="self-center">
            <div class="text-center text-xl">Image Conjuration Timed Out</div>
            <div class="text-center text-lg">
              {{ imageConjurationFailureReason }}
            </div>
            <div class="text-sm text-neutral-500 mb-2">
              You have not been charged any credits for this image.
            </div>
            <div>
              <button
                class="button-ghost-white flex mx-auto"
                @click="showCustomizeImageModal"
              >
                Retry Image
                <ArrowPathIcon class="w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editable" class="mt-2 xl:absolute flex gap-2 top-0 right-2">
      <button
        type="button"
        class="flex grow button-gradient bg-white/50"
        :disabled="!editable"
        @click="showCreateImageModal"
      >
        <span class="self-center w-full"> Conjure New Image</span>
      </button>
      <button
        v-if="!image.failed && image.uri"
        type="button"
        class="flex button-white bg-white/75"
        :disabled="!editable"
        @click="showCustomizeImageModal"
      >
        <PencilSquareIcon v-if="image.uri" class="h-5" />
      </button>
      <div class="relative group">
        <button
          v-if="image.uri"
          type="button"
          class="flex button-white bg-white/75"
          @click="downloadImage(image.uri)"
        >
          <ArrowDownTrayIcon class="h-5 w-5" />
        </button>
        <div
          class="absolute mt-2 top-[100%] right-0 hidden group-hover:block whitespace-nowrap px-2 py-1 bg-surface-3 rounded-full"
        >
          Download Image
        </div>
      </div>
      <div
        v-if="alreadyUpscaled"
        class="relative ml-2 self-center group/upscale"
      >
        <img
          src="@/assets/icons/gradient-sparkles.svg"
          alt="sparkles"
          class="w-6 h-6"
        />
        <div class="tooltip-bottom-left hidden group-hover/upscale:block">
          Upscaled
          <div class="tooltip-arrow" />
        </div>
      </div>
    </div>
  </div>
</template>
