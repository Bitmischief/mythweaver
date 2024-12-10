<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Spinner from '@/components/Core/Spinner.vue';
import { ServerEvent } from '@/lib/serverEvents';
import { useWebsocketChannel } from '@/lib/hooks';
import { showError } from '@/lib/notifications';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  imageId: number;
}>();

const channel = useWebsocketChannel();
const { editing } = storeToRefs(useImageEditorStore());
const { inpaintImage } = useImageEditorStore();

const prompt = ref<string>();

onMounted(() => {
  channel.bind(ServerEvent.ImageInpaintError, handleError);
});

onUnmounted(() => {
  channel.unbind(ServerEvent.ImageInpaintError, handleError);
});

const handleError = () => {
  showError({
    message:
      'Encountered an error modifying image. Please contact support if this issue persists.',
  });
};

const applyEdit = async () => {
  if (!prompt.value || !prompt.value.trim()) return;

  try {
    await inpaintImage(props.imageId, prompt.value);
  } catch (error) {
    console.error('Error applying inpainting:', error);
  }
};
</script>

<template>
  <div class="bg-surface rounded-3xl p-4">
    <div class="mb-4">
      <label>Prompt:</label>
      <Textarea
        id="inpaintPrompt"
        v-model="prompt"
        :rows="3"
        placeholder="Enter a prompt (e.g. clenched fists, leather armor)"
      />
    </div>
    <Button
      :disabled="editing || !prompt"
      class="button-purple"
      @click="applyEdit"
    >
      <Spinner v-if="editing" />
      {{ editing ? 'Processing...' : 'Apply changes' }}
    </Button>
  </div>
</template>
