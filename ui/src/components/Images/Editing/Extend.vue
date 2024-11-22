<script setup lang="ts">
import { ref, computed } from 'vue';
import { outpaint } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';
import { Select } from 'primevue';

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
  <div class="bg-surface rounded-3xl p-4">
    <div class="mb-4">
      <label>Prompt:</label>
      <Textarea
        id="outpaintPrompt"
        v-model="prompt"
        :rows="3"
        placeholder="Enter a prompt"
      />
    </div>
    <div>
      <hr class="border-zinc-500 my-2" />
    </div>
    <div class="flex flex-col gap-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-1 items-center">
        <div>
          <label>Extend Direction:</label>
          <Select
            v-model="direction"
            checkmark
            option-label="label"
            option-value="value"
            :options="[
              { label: 'Up', value: 'up' },
              { label: 'Down', value: 'down' },
              { label: 'Left', value: 'left' },
              { label: 'Right', value: 'right' },
            ]"
          />
        </div>
        <div>
          <label>Extend By:</label>
          <InputNumber
            v-model="pixels"
            :min="0"
            placeholder="Pixels"
            suffix="px"
          />
        </div>
      </div>
    </div>
    <Button
      :disabled="isEditing || !isValidDimensions || !prompt.trim()"
      class="button-purple"
      @click="applyOutpaint"
    >
      <Spinner v-if="isEditing" />
      {{ isEditing ? 'Processing...' : 'Apply Outpainting' }}
    </Button>
  </div>
</template>
