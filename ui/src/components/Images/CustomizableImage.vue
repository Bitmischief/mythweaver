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
    <div class="image-badge">
      {{ type }}
    </div>

    <div v-if="editable" class="absolute flex top-2 right-2">
      <div class="relative group ml-2">
        <button
          v-if="image.uri"
          type="button"
          class="flex button-white bg-white/50 mr-1"
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
      <button
        type="button"
        class="flex button-gradient bg-white/50"
        :disabled="!editable"
        @click="showCustomizeImageModal"
      >
        <PencilSquareIcon class="h-5 mr-1" />
        <span class="self-center">Modify Image</span>
      </button>
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
