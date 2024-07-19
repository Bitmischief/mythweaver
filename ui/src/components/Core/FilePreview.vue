<template>
  <component :is="tag" class="animate-pulse">
    <div class="bg-neutral-700 rounded-md p-3">
      {{ file.file.name }}
    </div>
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
