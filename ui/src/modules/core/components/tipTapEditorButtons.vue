<script setup lang="ts">
import ButtonGroup from 'primevue/buttongroup';
import { TipTapTool } from '@/modules/core/types';

defineProps<{
  tools: TipTapTool[];
}>();
</script>

<template>
  <ButtonGroup>
    <Button
      v-for="tool in tools"
      :key="tool.key"
      v-tooltip.top="{
        value: tool.tooltip,
        showDelay: 500,
        hideDelay: 100,
      }"
      class="p-1 hover:bg-fuchsia-500/25 hover:text-fuchsia-500"
      :class="{
        'button-purple': tool.isActive(),
        'button-ghost-white': !tool.isActive(),
      }"
      @click="tool.toggle()"
    >
      <component :is="tool.icon" class="h-4 w-4 m-1" />
    </Button>
  </ButtonGroup>
</template>
