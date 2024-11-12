<script setup lang="ts">
import { ref, computed } from 'vue';
import { outpaint } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';

const props = defineProps<{
  imageId: number;
}>();

const emit = defineEmits([
  'edit-applied',
  'edit-started',
  'edit-failed',
  'cancel',
]);

const isEditing = ref(false);
const prompt = ref('');
const upDimension = ref(0);
const downDimension = ref(0);
const leftDimension = ref(0);
const rightDimension = ref(0);
const direction = ref('up');
const pixels = ref(0);

const isValidDimensions = computed(() => {
  return (
    upDimension.value >= 0 ||
    downDimension.value >= 0 ||
    leftDimension.value >= 0 ||
    rightDimension.value >= 0
  );
});

const applyOutpaint = async () => {
  if (!isValidDimensions.value) return;

  isEditing.value = true;
  try {
    emit('edit-started');
    const editedImage = await outpaint(props.imageId, prompt.value, {
      up: direction.value === 'up' ? pixels.value : 0,
      down: direction.value === 'down' ? pixels.value : 0,
      left: direction.value === 'left' ? pixels.value : 0,
      right: direction.value === 'right' ? pixels.value : 0,
    });
    emit('edit-applied', editedImage);
  } catch (error) {
    console.error('Error applying outpaint:', error);
    emit('edit-failed');
  } finally {
    isEditing.value = false;
  }
};
</script>

<template>
  <div>
    <div class="mb-4">
      <label for="outpaintPrompt" class="block mb-2">Prompt:</label>
      <FormKit
        id="outpaintPrompt"
        v-model="prompt"
        type="textarea"
        :rows="3"
        placeholder="Enter a prompt"
        inner-class="$reset text-sm w-full bg-neutral-900 border border-zinc-600 rounded"
      />
    </div>
    <div>
      <hr class="border-zinc-500 my-2" />
    </div>
    <div class="flex flex-col gap-4 mb-4">
      <div class="flex gap-2">
        <div class="w-1/2">
          <label for="direction" class="block mb-1 text-xs text-neutral-500">
            Extend Direction:
          </label>
          <select
            id="direction"
            v-model="direction"
            class="w-full p-1 bg-neutral-900 border border-zinc-600 rounded mb-2"
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div class="w-1/2">
          <label for="pixels" class="block mb-1 text-xs text-neutral-500">
            Extend By:
          </label>
          <div class="relative">
            <input
              id="pixels"
              v-model.number="pixels"
              type="number"
              min="0"
              placeholder="Pixels"
              class="w-full p-1 pr-8 bg-neutral-900 border border-zinc-600 rounded"
            />
            <span
              class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 text-sm"
            >
              px
            </span>
          </div>
        </div>
      </div>
    </div>
    <button
      :disabled="isEditing || !isValidDimensions || !prompt.trim()"
      class="button-ghost w-full flex justify-center gap-2"
      @click="applyOutpaint"
    >
      <Spinner v-if="isEditing" />
      {{ isEditing ? 'Processing...' : 'Apply Outpainting' }}
    </button>
  </div>
</template>
