<script setup lang="ts">
import { Editor, BubbleMenu } from '@tiptap/vue-3';
import { TipTapTool } from '@/modules/core/types';
import ButtonGroup from 'primevue/buttongroup';

defineProps<{
  editor: Editor;
  tools: TipTapTool[];
}>();
</script>

<template>
  <BubbleMenu v-if="editor" :editor="editor" :tippy-options="{ duration: 100 }">
    <ButtonGroup class="bubble-menu">
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
  </BubbleMenu>
</template>
