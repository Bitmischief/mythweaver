<script setup lang="ts">
import CoreButton from '@/modules/core/components/buttons/CoreButton.vue';
</script>

<template>
  <CoreButton class="bg-[#CC52C0]/20 hover:bg-[#CC52C0]/40 text-[#CC52C0]">
    <slot />
  </CoreButton>
</template>
