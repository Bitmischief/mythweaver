<script setup lang="ts">
import { ref, computed } from 'vue';
import { outpaint } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';
import { FormKit } from '@formkit/vue';

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
  <div class="bg-surface-2 rounded-3xl p-4">
    <div class="mb-4">
      <FormKit
        id="outpaintPrompt"
        v-model="prompt"
        type="textarea"
        :rows="3"
        label="Prompt:"
        placeholder="Enter a prompt"
        validation="required"
        :validation-messages="{
          required: 'Please enter a prompt',
        }"
        input-class="text-sm w-full bg-neutral-900 border border-zinc-600 rounded"
      />
    </div>
    <div>
      <hr class="border-zinc-500 my-2" />
    </div>
    <div class="flex flex-col gap-4 mb-4">
      <div class="flex gap-2">
        <FormKit
          v-model="direction"
          type="select"
          label="Extend Direction:"
          :options="[
            { label: 'Up', value: 'up' },
            { label: 'Down', value: 'down' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ]"
          input-class="w-full p-1 bg-neutral-900 border border-zinc-600 rounded"
          outer-class="w-1/2"
        />

        <FormKit
          v-model="pixels"
          type="number"
          label="Extend By:"
          :min="0"
          placeholder="Pixels"
          suffix="px"
          validation="required|min:0"
          :validation-messages="{
            required: 'Please enter pixels',
            min: 'Must be 0 or greater',
          }"
          input-class="w-full p-1 pr-8 bg-neutral-900 border border-zinc-600 rounded"
          outer-class="w-1/2"
        />
      </div>
    </div>
    <FormKit
      type="submit"
      :disabled="isEditing || !isValidDimensions || !prompt.trim()"
      input-class="$reset button-purple w-full"
      @click="applyOutpaint"
    >
      <Spinner v-if="isEditing" />
      {{ isEditing ? 'Processing...' : 'Apply Outpainting' }}
    </FormKit>
  </div>
</template>
