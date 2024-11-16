<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import { onMounted, ref, watch } from 'vue';
import { useChangeImage } from '@/modules/images/composables/useChangeImage';

const props = withDefaults(
  defineProps<{
    image?: {
      id?: number | undefined;
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

const { changeImage } = useChangeImage();

const imgWidth = ref(0);
const imgHeight = ref(0);

onMounted(() => {
  setImgDimensions();
});

watch(
  () => props.image,
  () => {
    setImgDimensions();
  },
);

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

function beginChangeImage() {
  changeImage({
    currentImageId: props.image?.id,
    link: {
      conjurationId: props?.linking?.conjurationId,
      sessionId: props?.linking?.sessionId,
    },
  });
}
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
      </div>
    </div>

    <div v-if="editable" class="mt-2 xl:absolute flex gap-2 top-0 right-2">
      <button
        type="button"
        class="flex bg-neutral-700 text-neutral-300 rounded-lg px-2 py-0.5"
        :disabled="!editable"
        @click="beginChangeImage"
      >
        <span class="self-center w-full">Change Image</span>
      </button>
    </div>
  </div>
</template>
