<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { outpaint } from '@/api/images';
import Spinner from '@/components/Core/Spinner.vue';
import { Select } from 'primevue';
import { Image } from '@/modules/images/types/image';
import { useImages } from '@/modules/images/composables/useImages';

const props = defineProps<{
  imageId: number;
}>();

const emit = defineEmits([
  'edit-applied',
  'edit-started',
  'edit-failed',
  'cancel',
]);

const { getImage } = useImages();

const PIXEL_STEP = 150;

const isEditing = ref(false);
const prompt = ref('');
const upDimension = ref(0);
const downDimension = ref(0);
const leftDimension = ref(0);
const rightDimension = ref(0);
const direction = ref('down');
const image = ref<Image | undefined>(undefined);

onMounted(async () => {
  image.value = await getImage(props.imageId);
  prompt.value = image.value?.prompt || '';
});

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
      up: direction.value === 'up' ? PIXEL_STEP : 0,
      down: direction.value === 'down' ? PIXEL_STEP : 0,
      left: direction.value === 'left' ? PIXEL_STEP : 0,
      right: direction.value === 'right' ? PIXEL_STEP : 0,
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
    <div>
      <label>Prompt:</label>
      <Textarea
        id="outpaintPrompt"
        v-model="prompt"
        :rows="3"
        placeholder="Enter a prompt"
        class="w-full"
      />
    </div>
    <div class="mb-4">
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
    <Button
      :disabled="isEditing || !isValidDimensions"
      class="button-purple w-full"
      @click="applyOutpaint"
    >
      <Spinner v-if="isEditing" />
      {{
        isEditing
          ? 'Processing...'
          : `Extend Image ${direction.charAt(0).toUpperCase() + direction.slice(1)}`
      }}
    </Button>
  </div>
</template>
