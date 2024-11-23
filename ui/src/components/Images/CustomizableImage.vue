<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import { onMounted, ref, watch } from 'vue';
import { useEditImage } from '@/modules/images/composables/useEditImage';
import { PencilLine, ImagePlus } from 'lucide-vue-next';
import { useGenerateImages } from '@/modules/images/composables/useGenerateImages';
import SplitButton from 'primevue/splitbutton';
import Button from 'primevue/button';
import { useImageHistory } from '@/modules/images/composables/useImageHistory';
import { type Image } from '@/modules/images/types/image';

const props = withDefaults(
  defineProps<{
    image?: Image;
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
    image: () =>
      ({
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
      }) as unknown as Image,
    alt: undefined,
    imageConjurationFailureReason: undefined,
    type: undefined,
    linking: undefined,
  },
);

const { setSelectedImage } = useEditImage();
const {
  showModal: showGenerateImageModal,
  setLinkingContext,
  setPresetImageSettings,
} = useGenerateImages();
const { chooseFromImageHistory } = useImageHistory();

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
    await setSelectedImageById(props.image?.id);
  }
}

function showNewImageModal() {
  setPresetImageSettings({
    prompt: props.image?.prompt,
    selectedModelId: props.image?.modelId,
  });
  setLinkingContext({ conjurationId: props.linking?.conjurationId });
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

    <div v-if="editable" class="mt-2 flex gap-2">
      <SplitButton
        v-if="linking?.conjurationId"
        class="flex w-full"
        :disabled="!editable"
        :model="[
          {
            label: 'Choose from conjuration history',
            command: () => chooseFromImageHistory(linking.conjurationId!),
          },
        ]"
        @click="showNewImageModal"
      >
        <ImagePlus class="w-4 h-4" />
        New Image
      </SplitButton>

      <Button class="button-primary !py-1" @click="beginEditImage">
        <span class="w-full flex justify-center items-center gap-2">
          <PencilLine class="w-5 h-5" />
          Edit Image
        </span>
      </Button>
    </div>
  </div>
</template>
