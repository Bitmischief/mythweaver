<script setup lang="ts">
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
    linking?: {
      sessionId?: number;
      characterId?: number;
      conjurationId?: number;
    };
    hideNewImage?: boolean;
    hideEditImage?: boolean;
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
    editable: true,
    linking: undefined,
    hideNewImage: false,
    hideEditImage: false,
  },
);

const { setSelectedImageById } = useEditImage();
const {
  showModal: showGenerateImageModal,
  setLinkingContext,
  setPresetImageSettings,
} = useGenerateImages();
const { chooseFromImageHistory } = useImageHistory();

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
  <div class="flex gap-2">
    <SplitButton
      v-if="linking?.conjurationId && !hideNewImage"
      class="flex w-full"
      :disabled="!editable"
      :model="[
        {
          label: 'Choose from conjuration history',
          command: async () =>
            await chooseFromImageHistory(linking.conjurationId!),
        },
      ]"
      @click="showNewImageModal"
    >
      <ImagePlus class="w-4 h-4" />
      New Image
    </SplitButton>

    <Button
      v-if="!hideEditImage"
      class="button-primary !py-1"
      @click="beginEditImage"
    >
      <span class="w-full flex justify-center items-center gap-2">
        <PencilLine class="w-5 h-5" />
        Edit Image
      </span>
    </Button>
  </div>
</template>
