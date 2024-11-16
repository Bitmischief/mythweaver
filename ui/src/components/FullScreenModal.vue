<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';

defineProps<{
  show: boolean;
  extraDark?: boolean;
  z?: number;
}>();

const emit = defineEmits(['close']);

const handleEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc);
});
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 w-screen h-screen overflow-y-auto bg-surface-2"
    :style="z ? { zIndex: z || 20 } : undefined"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <slot></slot>
  </div>
</template>
