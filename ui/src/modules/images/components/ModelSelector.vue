<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { XMarkIcon, XCircleIcon } from '@heroicons/vue/20/solid';
import { useAvailableImageModels } from '../composables/useAvailableImageModels';
import { SelectedModelInput } from '../types/selectedModelInput';

const props = defineProps<{
  modelValue: SelectedModelInput[];
}>();

const emit = defineEmits(['update:modelValue']);

const { availableImageModels, imageModelsLoaded, defaultImageModel } =
  useAvailableImageModels();

const error = ref<string | null>(null);

const selectedModels = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const updateQuantity = (modelId: number, quantity: number | undefined = 0) => {
  selectedModels.value = selectedModels.value.map((m) =>
    m.id === modelId ? { ...m, quantity } : m,
  );
};

const removeModel = (modelId: number) => {
  selectedModels.value = selectedModels.value.filter((m) => m.id !== modelId);
};

watch(
  () => imageModelsLoaded,
  () => {
    if (defaultImageModel.value) {
      handleModelSelection([defaultImageModel.value.id]);
    }
  },
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

const handleModelSelection = (selectedIds: number[] | undefined) => {
  if (!selectedIds) return;

  const newSelectedModels = selectedIds.map((id) => {
    const existingModel = selectedModels.value.find((m) => m.id === id);
    const aiModel = availableImageModels.value.find((m) => m.id === id);
    if (!aiModel) throw new Error(`Model with id ${id} not found`);
    return (
      existingModel || {
        id: aiModel.id,
        description: aiModel.description,
        quantity: 1,
      }
    );
  });

  selectedModels.value = newSelectedModels;
};

const getModelById = (id: number) =>
  availableImageModels.value.find((m) => m.id === id);
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
              class="w-16 h-16 md:w-24 md:h-24 object-cover rounded mr-2"
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
        <template #chipicon="{ removeCallback }">
          <XMarkIcon
            class="w-5 h-5 cursor-pointer hover:bg-primary rounded-full"
            @click.prevent="removeCallback!"
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
            class="w-16 h-16 object-cover rounded"
          />
          <div class="">
            <span class="font-semibold">{{ model.description }}</span>
            <div class="text-sm text-gray-600 flex truncate">
              <div
                v-for="strength in getModelById(model.id)?.strengths"
                :key="strength"
                class="mr-2"
              >
                {{ strength }}
              </div>
            </div>
            <div class="text-xs">
              <span
                v-if="getModelById(model.id)?.licensedArt"
                class="text-green-500 mr-2"
              >
                Licensed Art
              </span>
              <span
                v-if="getModelById(model.id)?.default"
                class="text-blue-500"
              >
                Default
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center">
          <div class="max-w-12">
            <label>Qty</label>
            <InputNumber
              v-model="model.quantity"
              :min="1"
              :max="3"
              @update:model-value="updateQuantity(model.id, $event)"
            />
          </div>
          <div>
            <button class="p-1 mt-6" @click="removeModel(model.id)">
              <XCircleIcon class="h-5 text-red-500 hover:text-red-500/75" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
