<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ModelSelector from '../model/ModelSelector.vue';
import { useAvailableAspectRatios } from '../../composables/useAvailableAspectRatios';
import type { GenerateImageForm } from '../../types/generateImageForm';
import { useGenerateImages } from '../../composables/useGenerateImages';
import { Coins } from 'lucide-vue-next';
import { useConfirm } from 'primevue/useconfirm';
import Select from 'primevue/select';
import Panel from 'primevue/panel';
import { useSavedNegativePrompt } from '../../composables/useSavedNegativePrompt';

const props = withDefaults(
  defineProps<{
    prompt?: string;
  }>(),
  {
    prompt: undefined,
  },
);

const emit = defineEmits(['form-update']);

const { aspectRatios } = useAvailableAspectRatios();
const { generateImages, loading, generatedImages } = useGenerateImages();
const confirm = useConfirm();
const savedNegativePrompt = useSavedNegativePrompt();

const showAdvancedSettings = ref(false);
const formState = ref<GenerateImageForm>({
  selectedModels: [],
  prompt: props.prompt || '',
  aspectRatio: '1024x1024',
  referenceImageStrength: 50,
});

const isAspectRatioLocked = ref(false);
const uploadImageUri = ref();

const isPanelExpanded = ref(true);

const handleReferenceImageAddition = (e: any) => {
  if (e.files && e.files.length) {
    const file = e.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      if (e.target?.result) {
        uploadImageUri.value = e.target.result;
      }
    };
    reader.readAsDataURL(file);

    formState.value.referenceImageFile = file;
    formState.value.aspectRatio = '1024x1024';
    isAspectRatioLocked.value = true;
  } else {
    formState.value.referenceImageFile = undefined;
    isAspectRatioLocked.value = false;
  }
};

const hasGeneratingImages = computed(() => {
  return generatedImages.value.some((img) => img.generating);
});

const isMobileDevice = () => {
  return window.innerWidth <= 768;
};

const handleSubmit = async () => {
  if (formState.value.selectedModels.length === 0) {
    return;
  }

  if (
    formState.value.prompt.length === 0 ||
    formState.value.prompt.length > 2500
  ) {
    return;
  }

  if (savedNegativePrompt.value && savedNegativePrompt.value.length > 2500) {
    return;
  }

  if (hasGeneratingImages.value) {
    confirm.require({
      message:
        'You have images currently generating. Starting a new generation will cost more credits. Are you sure you want to continue?',
      header: 'Are you sure?',
      accept: async () => {
        await generateImages(formState.value);
        if (isMobileDevice()) {
          isPanelExpanded.value = false;
        }
      },
    });
  } else {
    await generateImages(formState.value);
    if (isMobileDevice()) {
      isPanelExpanded.value = false;
    }
  }
};

const totalQuantity = computed(() =>
  formState.value.selectedModels.reduce(
    (acc: number, model: { quantity: number }) => acc + model.quantity,
    0,
  ),
);

const clearReferenceImageFile = () => {
  formState.value.referenceImageFile = undefined;
  uploadImageUri.value = undefined;
};

watch(
  formState,
  (newValue) => {
    emit('form-update', newValue);
  },
  { deep: true },
);
</script>

<template>
  <Panel
    header="Image Generation Settings"
    :toggleable="loading || generatedImages.length > 0"
    :collapsed="!isPanelExpanded"
    class="mb-4"
  >
    <ModelSelector v-model="formState.selectedModels" />

    <div class="mt-6">
      <label>Prompt</label>
      <Textarea
        v-model="formState.prompt"
        :rows="3"
        placeholder="Describe the image you want to generate..."
        auto-resize
      />
      <div v-if="formState?.prompt?.length === 0" class="text-red-500 text-xs">
        Prompt must be provided
      </div>
      <div v-if="formState?.prompt?.length > 2500" class="text-red-500 text-xs">
        Prompt cannot exceed 2500 characters
      </div>
    </div>

    <div>
      <button
        class="w-full py-2 px-4 rounded-lg border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary text-left flex justify-between items-center mt-4"
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
      <div>
        <label>Negative Prompt</label>
        <Textarea
          v-model="savedNegativePrompt"
          :rows="3"
          placeholder="Describe what you don't want in the image..."
        />
        <div
          v-if="savedNegativePrompt && savedNegativePrompt?.length > 2500"
          class="text-red-500 text-xs"
        >
          Prompt cannot exceed 2500 characters
        </div>
      </div>

      <div>
        <label>Aspect Ratio</label>
        <Select
          v-model="formState.aspectRatio"
          option-label="label"
          option-value="value"
          :options="aspectRatios"
        />
      </div>

      <div>
        <label>Reference Image (optional)</label>
        <FileUpload
          v-if="!formState.referenceImageFile"
          accept="image/*"
          mode="basic"
          class="button-ghost"
          custom-upload
          @select="handleReferenceImageAddition"
        />
        <img
          v-if="uploadImageUri"
          :src="uploadImageUri"
          alt="Image"
          class="shadow-md rounded-xl w-full"
        />
      </div>
      <div v-if="formState.referenceImageFile" class="mt-2 flex items-center">
        <p class="text-sm text-zinc-400 mr-2">
          Selected: {{ formState.referenceImageFile.name }}
        </p>

        <button
          class="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          @click="clearReferenceImageFile"
        >
          Clear
        </button>
      </div>

      <div v-if="formState.referenceImageFile">
        <label>Image Strength</label>
        <div class="flex items-center my-2">
          <div class="text-xs text-neutral-500">Very creative</div>
          <div class="py-1 mx-3 rounded-full bg-surface-3 grow">
            <Slider
              v-model="formState.referenceImageStrength"
              :min="1"
              :max="100"
              :step="1"
            />
          </div>
          <div class="text-xs text-neutral-500">Very similar</div>
        </div>
        <div class="text-xs text-neutral-500">
          Adjust the balance between creativity and similarity to the reference
          image
        </div>
      </div>
    </div>

    <div class="mt-6 flex w-full justify-end">
      <Button class="button-purple" @click="handleSubmit">
        <div v-if="loading" class="flex items-center gap-2">
          <Spinner />
          <div class="text-lg">Generating...</div>
        </div>
        <div v-else class="flex gap-2">
          <div class="self-center text-lg">Generate Images</div>
          <div class="self-center flex gap-1 text-lg">
            {{ totalQuantity }}
            <Coins class="self-center" />
          </div>
        </div>
      </Button>
    </div>

    <div class="text-sm text-zinc-400 mt-2">
      {{ formState.selectedModels.length }} model(s) selected,
      {{
        aspectRatios.find((r) => r.value === formState.aspectRatio)?.label ||
        formState.aspectRatio
      }}
      aspect ratio
    </div>
  </Panel>

  <slot name="generated-images"></slot>
</template>
