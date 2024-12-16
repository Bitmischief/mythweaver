<script lang="ts" setup>
const model = defineModel<boolean>();
</script>

<template>
  <div v-if="model" class="w-full mt-2">
    <div class="h-1.5 w-full bg-surface-3 overflow-hidden rounded-full">
      <div class="progress w-full h-full bg-gradient left-right"></div>
    </div>
  </div>
</template>
