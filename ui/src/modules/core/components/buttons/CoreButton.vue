<script setup lang="ts">
import Button from 'primevue/button';
</script>

<template>
  <Button
    v-bind="$attrs"
    class="px-4 py-2 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-[12px]"
  >
    <slot />
  </Button>
</template>
