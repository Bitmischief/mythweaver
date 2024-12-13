<script setup lang="ts">
import { ref } from 'vue';
import { Eraser, Fullscreen, Paintbrush, ArrowUpToLine } from 'lucide-vue-next';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';
import { Dialog } from 'primevue';
import { ImageEditorTool } from '@/modules/images/types/imageEditorTool';

const { selectedTool } = storeToRefs(useImageEditorStore());
const { setEditMode } = useImageEditorStore();

const tools = [
  { mode: 'inpaint', label: 'Inpaint', soon: false },
  { mode: 'outpaint', label: 'Outpaint', soon: false },
  { mode: 'erase', label: 'Erase', soon: false },
  { mode: 'upscale', label: 'Upscale', soon: true },
];

const showUpscaleDialog = ref(false);
</script>

<template>
  <div
    class="flex items-center lg:flex-col w-full gap-2 justify-around rounded-2xl p-2 bg-surface"
  >
    <div v-for="(tool, i) in tools" :key="`tool_${i}`" class="text-neutral-500">
      <button
        class="p-2 rounded-lg text-sm cursor-pointer flex flex-col items-center justify-center aspect-square w-full relative"
        :class="{
          'bg-fuchsia-800/25 text-fuchsia-600':
            selectedTool === tool.mode && tool.mode === 'inpaint',
          'bg-yellow-800/25 text-yellow-600':
            selectedTool === tool.mode && tool.mode === 'outpaint',
          'bg-blue-800/25 text-blue-600':
            selectedTool === tool.mode && tool.mode === 'erase',
          'opacity-80': tool.soon,
        }"
        @click="
          tool.soon
            ? (showUpscaleDialog = true)
            : setEditMode(tool.mode as ImageEditorTool)
        "
      >
        <template v-if="tool.mode === 'inpaint'">
          <Paintbrush class="h-5 w-5" />
        </template>
        <template v-if="tool.mode === 'outpaint'">
          <Fullscreen class="h-5 w-5" />
        </template>
        <template v-if="tool.mode === 'erase'">
          <Eraser class="h-5 w-5" />
        </template>
        <template v-if="tool.mode === 'upscale'">
          <ArrowUpToLine class="h-5 w-5" />
        </template>
        {{ tool.label }}
        <span
          v-if="tool.soon"
          class="absolute top-0 -right-1 bg-purple-500 text-white text-xs px-1 rounded"
        >
          Soon
        </span>
      </button>
    </div>
  </div>
  <Dialog v-model:visible="showUpscaleDialog" modal :style="{ width: '400px' }">
    <template #header>
      <div class="gradient-text text-2xl">Upscaling Coming Soon</div>
    </template>
    <p class="m-0">
      The upscaling feature is currently being overhauled to provide better
      quality results. It will be re-added shortly. Thank you for your patience!
    </p>
    <template #footer>
      <Button label="Close" @click="showUpscaleDialog = false" />
    </template>
  </Dialog>
</template>
