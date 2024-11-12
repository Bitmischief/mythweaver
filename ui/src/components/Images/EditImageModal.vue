<script lang="ts" setup>
import ImageEditor from './Editing/ImageEditor.vue';

withDefaults(
  defineProps<{
    image?: {
      id?: number;
      uri?: string;
    };
  }>(),
  {
    image: () => ({
      id: undefined,
      uri: undefined,
    }),
  },
);

const emit = defineEmits(['close']);
</script>

<template>
  <div class="fixed inset-0 z-50 bg-neutral-900">
    <ImageEditor :image="image" @close="emit('close')" />
  </div>
</template>
