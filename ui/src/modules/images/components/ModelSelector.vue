<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/20/solid';
import { useAvailableImageModels } from '../composables/useAvailableImageModels';
import { SelectedModelInput } from '../types/selectedModelInput';
import { useGenerateImages } from '../composables/useGenerateImages';
import Select from 'primevue/select';

const props = defineProps<{
  modelValue: SelectedModelInput[];
}>();

const emit = defineEmits(['update:modelValue']);

const { availableImageModels, imageModelsLoaded, defaultImageModel } =
  useAvailableImageModels();
const { presetSettings } = useGenerateImages();

const error = ref<string | null>(null);

const selectedModels = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleModelSelection = (selectedIds: number[] | undefined) => {
  if (!selectedIds || !imageModelsLoaded.value) return;

  const newSelectedModels = selectedIds
    .map((id) => {
      const existingModel = selectedModels.value.find((m) => m.id === id);
      const aiModel = availableImageModels.value.find((m) => m.id === id);

      if (!aiModel) {
        error.value = `Unable to find model ${id}. Please try again.`;
        return null;
      }

      return (
        existingModel || {
          id: aiModel.id,
          description: aiModel.description,
          quantity: 1,
        }
      );
    })
    .filter((model): model is NonNullable<typeof model> => model !== null);

  selectedModels.value = newSelectedModels;
};

watch(
  () => imageModelsLoaded.value,
  (isLoaded) => {
    if (!isLoaded) return;

    if (presetSettings.value?.selectedModelId) {
      handleModelSelection([presetSettings.value.selectedModelId]);
    } else if (defaultImageModel.value) {
      handleModelSelection([defaultImageModel.value.id]);
    }
  },
  { immediate: true },
);

const modelOptions = computed(() =>
  availableImageModels.value?.map((model) => ({
    value: model.id,
    label: model.description,
    sampleImageUri: model.sampleImageUris[0],
    strengths: model.strengths,
    licensedArt: model.licensedArt,
    default: model.default,
  })),
);

const updateQuantity = (modelId: number, quantity: number | undefined = 0) => {
  selectedModels.value = selectedModels.value.map((m) =>
    m.id === modelId ? { ...m, quantity } : m,
  );
};

const removeModel = (modelId: number) => {
  selectedModels.value = selectedModels.value.filter((m) => m.id !== modelId);
};

const getModelById = (id: number) => {
  if (!imageModelsLoaded.value) return undefined;
  return availableImageModels.value.find((m) => m.id === id);
};
</script>

<template>
  <div v-if="!imageModelsLoaded" class="text-center py-4">
    Loading Models...
  </div>
  <div v-else-if="error" class="text-center py-4 text-red-500">
    {{ error }}
  </div>
  <div v-else>
    <div class="mb-6">
      <label>Select Models</label>
      <MultiSelect
        :options="modelOptions"
        option-label="label"
        option-value="value"
        :model-value="selectedModels.map((m) => m.id)"
        multiple
        placeholder="Choose models"
        close-on-select="true"
        :show-toggle-all="false"
        display="chip"
        @update:model-value="handleModelSelection"
      >
        <template #option="{ option }">
          <div class="flex w-full items-center">
            <img
              :src="option.sampleImageUri"
              :alt="option.label"
              class="w-16 h-16 object-cover rounded mr-2"
            />
            <div>
              <div class="font-semibold">{{ option.label }}</div>
              <div class="text-sm -muted">
                <span
                  v-for="strength in option.strengths"
                  :key="strength"
                  class="mr-2"
                  >{{ strength }}</span
                >
              </div>
              <div class="text-xs">
                <span v-if="option.licensedArt" class="text-green-500 mr-2"
                  >Licensed Art</span
                >
                <span v-if="option.default" class="text-blue-500">Default</span>
              </div>
            </div>
            <div v-if="option.selected" class="text-xs text-green-500">
              Selected
            </div>
          </div>
        </template>
        <template #chipicon="{ item, removeCallback }">
          <XMarkIcon
            class="w-5 h-5 cursor-pointer hover:bg-primary rounded-full"
            @click.prevent="(e: Event) => removeCallback(e, item)"
          />
        </template>
      </MultiSelect>
    </div>

    <div v-if="selectedModels.length > 0" class="mt-6">
      <h3 class="text-zinc-600 underline mb-2 font-semibold">
        Selected Models
      </h3>
      <div
        v-for="model in selectedModels"
        :key="model.id"
        class="flex items-center justify-between min-w-0 my-2"
      >
        <div class="flex items-center gap-2">
          <img
            :src="getModelById(model.id)?.sampleImageUris[0]"
            :alt="model.description"
            class="w-12 h-12 object-cover rounded"
          />
          <div class="">
            <span class="font-semibold">{{ model.description }}</span>
            <div>
              <button
                class="py-0.5 text-neutral-500 text-xs hover:text-red-500"
                @click="removeModel(model.id)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center">
          <div class="max-w-12">
            <label>Qty</label>
            <Select
              v-model="model.quantity"
              :options="[1, 2, 3]"
              class="w-16"
              @change="updateQuantity(model.id, $event.value)"
            />
          </div>
          <div></div>
        </div>
      </div>
    </div>
  </div>
</template>
