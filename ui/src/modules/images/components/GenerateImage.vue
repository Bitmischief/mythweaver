<script setup lang="ts">
import { ref } from 'vue';
import type { FormKitFile } from '@formkit/inputs';
import ModelSelector from './ModelSelector.vue';
import { useAvailableAspectRatios } from '../composables/useAvailableAspectRatios';
import { GenerateImageForm } from '../types/generateImageForm';
import { useGenerateImages } from '../composables/useGenerateImages';

const { aspectRatios } = useAvailableAspectRatios();
const { generateImages } = useGenerateImages();

const showAdvancedSettings = ref(false);
const formState = ref<GenerateImageForm>({
  selectedModels: [],
  prompt: '',
  aspectRatio: '1024x1024',
});

const isAspectRatioLocked = ref(false);

const handleReferenceImageAddition = (files: FormKitFile[] | undefined) => {
  if (files && files.length > 0) {
    formState.value.referenceImageFile = files[0];

    formState.value.aspectRatio = '1024x1024';
    isAspectRatioLocked.value = true;
  } else {
    formState.value.referenceImageFile = undefined;
    isAspectRatioLocked.value = false;
  }
};

const handleSubmit = async () => {
  await generateImages(formState.value);
};
</script>

<template>
  <FormKit
    type="form"
    :actions="false"
    @submit="handleSubmit"
  >
    <ModelSelector v-model="formState.selectedModels" />

    <FormKit
      type="textarea"
      v-model="formState.prompt"
      label="Prompt"
      validation="required"
      :validation-messages="{ required: 'Prompt is required' }"
      :rows="3"
      placeholder="Describe the image you want to generate..."
    />

    <div>
      <button
          @click="showAdvancedSettings = !showAdvancedSettings"
          class="w-full py-2 px-4 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex justify-between items-center"
      >
          <span>Advanced Settings</span>
          <span
          :class="{ 'rotate-180': showAdvancedSettings }"
          class="transition-transform duration-300"
          >▼</span
          >
      </button>
    </div>

    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      leave-active-class="transition-all duration-300 ease-in"
      @enter="
          (el: Element) => ((el as HTMLElement).style.maxHeight = `${el.scrollHeight}px`)
      "
      @leave="(el: Element) => ((el as HTMLElement).style.maxHeight = '0px')"
    >
      <div
          v-show="showAdvancedSettings"
          class="space-y-4 overflow-hidden"
          :style="{ maxHeight: showAdvancedSettings ? '1000px' : '0px' }"
      >
        <FormKit
          type="textarea"
          v-model="formState.negativePrompt"
          label="Negative Prompt"
          :rows="3"
          placeholder="Describe what you don't want in the image..."
        />

        <FormKit
          type="select"
          v-model="formState.aspectRatio"
          label="Aspect Ratio"
          :options="aspectRatios"
        />

        <div>
          <FormKit
            type="file"
            label="Reference Image (optional)"
            accept="image/*"
            @input="handleReferenceImageAddition"
          />

          <div v-if="formState.referenceImageFile" class="mt-2 flex items-center">
            <p class="text-sm text-zinc-400 mr-2">
              Selected: {{ formState.referenceImageFile.name }}
            </p>

            <button
              @click="formState.referenceImageFile = undefined"
              class="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
              >
              Clear
            </button>
          </div>
        </div>

        <FormKit
          v-if="formState.referenceImageFile"
          type="range"
          v-model="formState.referenceImageStrength"
          label="Image Strength"
          number
          :min="1"
          :max="100"
          :step="1"
          help="Adjust the balance between creativity and similarity to the reference image"
        >
          <template #help>
            <div class="flex justify-between text-sm text-zinc-400 mt-1">
              <span>Very creative</span>
              <span>Medium</span>
              <span>Very similar</span>
            </div>
          </template>
        </FormKit>
      </div>
    </Transition>

    <div class="text-sm text-zinc-400">
      {{ formState.selectedModels.length }} model(s) selected,
      {{ aspectRatios.find((r) => r.value === formState.aspectRatio)?.label || formState.aspectRatio }} aspect
      ratio
    </div>

    <FormKit
      type="submit"
      input-class="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors shadow-lg"
      :disabled="formState.selectedModels.length === 0"
    >
      Generate Images
    </FormKit>
  </FormKit>
</template>