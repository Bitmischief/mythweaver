<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormKitFile } from '@formkit/inputs';
import ModelSelector from './ModelSelector.vue';
import { useAvailableAspectRatios } from '../composables/useAvailableAspectRatios';
import { GenerateImageForm } from '../types/generateImageForm';
import { useGenerateImages } from '../composables/useGenerateImages';
import { Coins } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    prompt?: string;
  }>(),
  {
    linking: undefined,
    prompt: undefined,
  },
);

const { aspectRatios } = useAvailableAspectRatios();
const { generateImages } = useGenerateImages();

const showAdvancedSettings = ref(false);
const formState = ref<GenerateImageForm>({
  selectedModels: [],
  prompt: props.prompt || '',
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
  formState.value.linking = props.linking;
  await generateImages(formState.value);
};

const totalQuantity = computed(() =>
  formState.value.selectedModels.reduce(
    (acc, model) => acc + model.quantity,
    0,
  ),
);
</script>

<template>
  <FormKit type="form" :actions="false" @submit="handleSubmit">
    <ModelSelector v-model="formState.selectedModels" />

    <div class="mt-6">
      <FormKit
        v-model="formState.prompt"
        type="textarea"
        label="Prompt"
        validation="required"
        :validation-messages="{ required: 'Prompt is required' }"
        :rows="3"
        placeholder="Describe the image you want to generate..."
        :auto-height="formState.prompt.length > 0"
      />
    </div>

    <div>
      <button
        class="w-full py-2 px-4 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-left flex justify-between items-center"
        @click="showAdvancedSettings = !showAdvancedSettings"
      >
        <span>Advanced Settings</span>
        <span
          :class="{ 'rotate-180': showAdvancedSettings }"
          class="transition-transform duration-300"
          >▼</span
        >
      </button>
    </div>

    <div
      v-show="showAdvancedSettings"
      class="space-y-4 overflow-hidden mt-4"
      :style="{ maxHeight: showAdvancedSettings ? 'none' : '0px' }"
    >
      <FormKit
        v-model="formState.negativePrompt"
        type="textarea"
        label="Negative Prompt"
        :rows="3"
        placeholder="Describe what you don't want in the image..."
      />

      <FormKit
        v-model="formState.aspectRatio"
        type="select"
        label="Aspect Ratio"
        option-class="$reset bg-surface focus:bg-violet-500/75"
        :options="aspectRatios"
      />

      <div v-if="formState.referenceImageFile" class="mt-2 flex items-center">
        <p class="text-sm text-zinc-400 mr-2">
          Selected: {{ formState.referenceImageFile.name }}
        </p>

        <button
          class="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          @click="formState.referenceImageFile = undefined"
        >
          Clear
        </button>
      </div>

      <FormKit
        v-if="formState.referenceImageFile"
        v-model="formState.referenceImageStrength"
        type="range"
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

    <div class="mt-4 flex w-full justify-end">
      <FormKit
        type="submit"
        input-class="w-full justify-center bg-primary text-white rounded-lg hover:bg-primary-light transition-colors shadow-lg"
        :disabled="formState.selectedModels.length === 0"
      >
        <div class="flex gap-2">
          <div class="self-center text-lg">Generate Images</div>
          <div class="self-center flex gap-1 text-lg">
            {{ totalQuantity }}
            <Coins class="self-center" />
          </div>
        </div>
      </FormKit>
    </div>

    <div class="text-sm text-zinc-400">
      {{ formState.selectedModels.length }} model(s) selected,
      {{
        aspectRatios.find((r) => r.value === formState.aspectRatio)?.label ||
        formState.aspectRatio
      }}
      aspect ratio
    </div>
  </FormKit>
</template>
