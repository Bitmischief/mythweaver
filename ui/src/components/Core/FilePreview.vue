<template>
  <component :is="tag" class="file-preview">
    <button class="close-icon" @click="$emit('remove', file)">&times;</button>

    <div class="bg-neutral-700 rounded-md p-3">
      {{ file.file.name }}
    </div>

    <span
      v-show="file.status === 'loading'"
      class="status-indicator loading-indicator"
      >In Progress</span
    >
    <span
      v-show="file.status === 'success'"
      class="status-indicator success-indicator"
      >Uploaded</span
    >
    <span
      v-show="file.status === 'error'"
      class="status-indicator failure-indicator"
      >Error</span
    >
  </component>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps } from 'vue';
import { UploadableFile } from '@/compositions/uploadableFile.ts';

defineProps<{
  file: UploadableFile;
  tag?: string;
}>();

defineEmits(['remove']);
</script>

<style scoped lang="scss">
.file-preview {
  .close-icon,
  .status-indicator {
    $size: 20px;
    position: absolute;
    line-height: $size;
    height: $size;
    border-radius: $size;
    box-shadow: 0 0 5px currentColor;
    right: 0.25rem;
    appearance: none;
    border: 0;
    padding: 0;
  }

  .close-icon {
    width: 2rem;
    font-size: 1rem;
    background: #933;
    color: #fff;
    top: 0.25rem;
    cursor: pointer;
  }

  .status-indicator {
    font-size: 1rem;
    bottom: 0.25rem;
    padding: 0 10px;
  }

  .loading-indicator {
    animation: pulse 1.5s linear 0s infinite;
    color: #000;
  }

  .success-indicator {
    background: #6c6;
    color: #040;
  }

  .failure-indicator {
    background: #933;
    color: #fff;
  }
}

@keyframes pulse {
  0% {
    background: #fff;
  }

  50% {
    background: #ddd;
  }

  100% {
    background: #fff;
  }
}
</style>
