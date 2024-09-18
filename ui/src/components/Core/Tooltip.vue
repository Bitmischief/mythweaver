<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}>();

const positionClasses = computed(() => {
  switch (props.position) {
    case 'top':
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    case 'bottom':
      return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
    case 'left':
      return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
    case 'right':
      return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
    default:
      return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
  }
});
</script>

<template>
  <div class="relative group">
    <slot></slot>
    <div
      :class="[
        'absolute px-3 py-1 bg-neutral-800 text-neutral-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap',
        positionClasses
      ]"
    >
      {{ text }}
    </div>
  </div>
</template>

<style scoped>
.group:hover .absolute {
  display: block;
}
</style>