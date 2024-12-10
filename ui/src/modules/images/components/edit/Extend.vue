<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Spinner from '@/components/Core/Spinner.vue';
import { Select } from 'primevue';
import { Image } from '@/modules/images/types/image';
import { useImages } from '@/modules/images/composables/useImages';
import { ServerEvent } from '@/lib/serverEvents';
import { useWebsocketChannel } from '@/lib/hooks';
import { showError } from '@/lib/notifications';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  imageId: number;
}>();

const { getImage } = useImages();
const { outpaintImage } = useImageEditorStore();
const { editing } = storeToRefs(useImageEditorStore());
const channel = useWebsocketChannel();

const PIXEL_STEP = 150;

const prompt = ref('');
const upDimension = ref(0);
const downDimension = ref(0);
const leftDimension = ref(0);
const rightDimension = ref(0);
const direction = ref('down');

const image = ref<Image | undefined>(undefined);

onMounted(async () => {
  channel.bind(ServerEvent.ImageOutpaintError, handleError);
  image.value = await getImage(props.imageId);
  prompt.value = image.value?.prompt || '';
});

onUnmounted(() => {
  channel.unbind(ServerEvent.ImageOutpaintError, handleError);
});

const handleError = () => {
  showError({
    message:
      'Encountered an error extending image. Please contact support if this issue persists.',
  });
};

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

  try {
    await outpaintImage(props.imageId, prompt.value, {
      up: direction.value === 'up' ? PIXEL_STEP : 0,
      down: direction.value === 'down' ? PIXEL_STEP : 0,
      left: direction.value === 'left' ? PIXEL_STEP : 0,
      right: direction.value === 'right' ? PIXEL_STEP : 0,
    });
  } catch (error) {
    showError({
      message:
        'Encountered an error smart erasing image. Please contact support if this issue persists.',
    });
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
      :disabled="editing || !isValidDimensions"
      class="button-purple w-full"
      @click="applyOutpaint"
    >
      <Spinner v-if="editing" />
      {{
        editing
          ? 'Processing...'
          : `Extend Image ${direction.charAt(0).toUpperCase() + direction.slice(1)}`
      }}
    </Button>
  </div>
</template>
