<script setup lang="ts">
import CoreButton from '@/modules/core/components/buttons/CoreButton.vue';
</script>

<template>
  <CoreButton class="bg-gradient-to-r from-fuchsia-500 to-violet-500">
    <slot />
  </CoreButton>
</template>
