<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import { onMounted, ref, watch } from 'vue';
import { useEditImage } from '@/modules/images/composables/useEditImage';
import { PencilLine, ImagePlus } from 'lucide-vue-next';
import { useGenerateImages } from '@/modules/images/composables/useGenerateImages';
import SecondaryButton from '@/modules/core/components/buttons/SecondaryButton.vue';
import Button from '@/modules/core/components/buttons/Button.vue';

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

const { setSelectedImage } = useEditImage();
const { showModal: showGenerateImageModal } = useGenerateImages();

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

async function beginEditImage() {
  if (props.image?.id) {
    await setSelectedImage(props.image?.id);
  }
}

function handleNewImage() {
  showGenerateImageModal.value = true;
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

    <div v-if="editable" class="mt-2 flex gap-2 top-0 right-2">
      <Button
        type="button"
        class="button-primary w-[12rem]"
        :disabled="!editable"
        @click="handleNewImage"
      >
        <span class="w-full flex justify-center items-center gap-2">
          <ImagePlus class="w-5 h-5" />
          New Image
        </span>
      </Button>
      <SecondaryButton class="w-full" @click="beginEditImage">
        <span class="w-full flex justify-center items-center gap-2">
          <PencilLine class="w-5 h-5" />
          Edit Image
        </span>
      </SecondaryButton>
    </div>
  </div>
</template>
