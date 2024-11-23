<script setup lang="ts">
import ViewImage from './ViewImage.vue';
import { useGenerateImages } from '../composables/useGenerateImages';
import GenerateImageForm from './GenerateImageForm.vue';
import { ref } from 'vue';

const { generatedImages, presetSettings } = useGenerateImages();

const props = withDefaults(
  defineProps<{
    allowEdits: boolean;
    prompt?: string;
  }>(),
  {
    allowEdits: true,
    linking: undefined,
    prompt: undefined,
  },
);

const emit = defineEmits(['primaryImageSet', 'cancel', 'insertImage']);

const prompt = ref(props.prompt ?? presetSettings.value?.prompt ?? '');

const handlePrimaryImageSet = (imageId: number) => {
  emit('primaryImageSet', imageId);
};
</script>

<template>
  <div class="md:flex w-full mt-4">
    <div class="md:w-1/3">
      <GenerateImageForm :prompt="prompt" />
    </div>
    <div class="mt-8 md:mt-0 md:ml-8 w-full overflow-y-scroll">
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
