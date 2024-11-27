<script setup lang="ts">
import ViewImage from './ViewImage.vue';
import { useGenerateImages } from '../composables/useGenerateImages';
import GenerateImageForm from './GenerateImageForm.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import type { GenerateImageForm as GenerateImageFormType } from '../types/generateImageForm';

const { generatedImages, presetSettings, clearGeneratedImages } =
  useGenerateImages();
const confirm = useConfirm();

const props = withDefaults(
  defineProps<{
    allowEdits: boolean;
    prompt?: string;
  }>(),
  {
    allowEdits: true,
    prompt: undefined,
  },
);

onMounted(() => {
  clearGeneratedImages();
});

onUnmounted(() => {
  clearGeneratedImages();
});

const emit = defineEmits(['primaryImageSet', 'cancel', 'insertImage']);
const currentFormState = ref<GenerateImageFormType | null>(null);

const prompt = ref(props.prompt ?? presetSettings.value?.prompt ?? '');

const handlePrimaryImageSet = (imageId: number) => {
  emit('primaryImageSet', imageId);
};

const handleFormStateUpdate = (formState: GenerateImageFormType) => {
  currentFormState.value = formState;
};

const handleRetryGeneration = async (imageId: number) => {
  if (!currentFormState.value) return;

  const { retryGeneration } = useGenerateImages();
  const hasGeneratingImages = generatedImages.value.some(
    (img) => img.generating,
  );

  if (hasGeneratingImages) {
    confirm.require({
      message:
        'You have images currently generating. Starting a new generation will cancel the current one. Do you want to continue?',
      header: 'Confirm Retry Generation',
      accept: async () => {
        try {
          await retryGeneration(currentFormState.value!, imageId);
        } catch (error) {
          console.error('Failed to retry image generation:', error);
        }
      },
    });
  } else {
    try {
      await retryGeneration(currentFormState.value, imageId);
    } catch (error) {
      console.error('Failed to retry image generation:', error);
    }
  }
};
</script>

<template>
  <div class="md:flex w-full mt-4">
    <div class="md:w-1/3">
      <GenerateImageForm
        :prompt="prompt"
        @form-update="handleFormStateUpdate"
      />
    </div>
    <div class="mt-8 md:mt-0 md:ml-8 w-full overflow-y-scroll">
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ViewImage
          v-for="image in generatedImages"
          :key="image.id"
          :image="image"
          :allow-edits="allowEdits"
          @primary-image-set="handlePrimaryImageSet"
          @retry-generation="handleRetryGeneration"
        />
      </div>
    </div>
  </div>
</template>
