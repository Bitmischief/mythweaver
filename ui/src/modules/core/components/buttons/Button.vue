<script setup lang="ts">
import CoreButton from '@/modules/core/components/buttons/CoreButton.vue';
</script>

<template>
  <CoreButton
    class="disabled:bg-surface-3/50 disabled:text-neutral-500 bg-surface-3 text-white"
  >
    <slot />
  </CoreButton>
</template>
