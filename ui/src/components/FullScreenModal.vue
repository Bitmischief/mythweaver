<template>
  <div
    v-if="show"
    class="fixed inset-0 w-screen h-screen overflow-y-auto z-40 bg-surface-2"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
    @click="emit('close')"
  >
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  show: boolean;
  extraDark?: boolean;
}>();

const emit = defineEmits(['close']);
</script>
