<script setup lang="ts">
import { ref } from 'vue';
import Spinner from '@/components/Core/Spinner.vue';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  imageId: number;
}>();

const { editing } = storeToRefs(useImageEditorStore());
const { inpaintImage } = useImageEditorStore();

const prompt = ref<string>();

const applyEdit = async () => {
  if (!prompt.value || !prompt.value.trim()) return;
  await inpaintImage(props.imageId, prompt.value);
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
