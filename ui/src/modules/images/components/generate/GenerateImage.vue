<script setup lang="ts">
import ViewImage from '../ViewImage.vue';
import { useGenerateImages } from '../../composables/useGenerateImages';
import GenerateImageForm from '../generate/GenerateImageForm.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import type { GenerateImageForm as GenerateImageFormType } from '../../types/generateImageForm';

const { generatedImages, presetSettings, clearGeneratedImages } =
  useGenerateImages();

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
</script>

<template>
  <div class="lg:flex w-full mt-12 md:mt-6">
    <div class="w-full lg:w-[30rem]">
      <GenerateImageForm
        :prompt="prompt"
        @form-update="handleFormStateUpdate"
      />
    </div>
    <div class="mt-8 lg:mt-0 lg:ml-8 lg:w-full overflow-y-scroll">
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ViewImage
          v-for="image in generatedImages"
          :key="image.id"
          :image="image"
          :allow-edits="allowEdits"
          @primary-image-set="handlePrimaryImageSet"
        />
      </div>
    </div>
  </div>
</template>
