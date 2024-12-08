<script setup lang="ts">
import { Paintbrush, Eraser, Undo, Redo } from 'lucide-vue-next';

defineProps<{
  brushSize: number;
  isEraseMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  disableMask: boolean;
}>();

const emit = defineEmits<{
  'update:brushSize': [value: number];
  'toggle-edit-mode': [];
  'toggle-erase-mode': [];
  'clear-mask': [];
  undo: [];
  redo: [];
  'update-brush-preview': [event: MouseEvent];
  'clear-preview': [];
}>();
</script>

<template>
  <div class="bg-surface rounded-3xl w-full sm:w-auto sm:rounded-full p-2">
    <div class="sm:flex items-center">
      <div class="flex justify-center gap-2">
        <div class="text-center">
          <button
            class="control-button"
            :class="{ active: !isEraseMode }"
            :title="isEraseMode ? 'Switch to Brush' : 'Switch to Eraser'"
            :disabled="disableMask"
            @click="emit('toggle-edit-mode')"
          >
            <Paintbrush class="h-5 w-5" />
          </button>
        </div>
        <div class="text-center">
          <button
            class="control-button"
            :class="{ active: isEraseMode }"
            :title="isEraseMode ? 'Switch to Brush' : 'Switch to Eraser'"
            :disabled="disableMask"
            @click="emit('toggle-erase-mode')"
          >
            <Eraser class="h-5 w-5" />
          </button>
        </div>
        <div class="sm:hidden text-sm text-center self-center text-neutral-500">
          This editor is experimental on mobile devices.
        </div>
        <div class="hidden sm:block">
          <div
            class="px-2 py-3 mx-2 rounded-full bg-surface-3 opacity-100 aria-[disabled=true]:opacity-25"
            :aria-disabled="disableMask"
          >
            <Slider
              :model-value="brushSize"
              :min="5"
              :max="200"
              name="brush-size"
              class="w-36"
              :disabled="disableMask"
              @update:model-value="
                (value: any) =>
                  $emit(
                    'update:brushSize',
                    Array.isArray(value) ? value[0] : value,
                  )
              "
              @click="emit('update-brush-preview', $event)"
              @mousemove="emit('update-brush-preview', $event)"
              @mouseleave="emit('clear-preview')"
            />
          </div>
        </div>
        <div class="flex justify-center gap-2 pl-3 border-l border-neutral-800">
          <button
            class="control-button"
            :disabled="!canUndo"
            @click="emit('undo')"
          >
            <Undo class="h-5 w-5" />
          </button>
          <button
            class="control-button"
            :disabled="!canRedo"
            @click="emit('redo')"
          >
            <Redo class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-button-text {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  height: 42px;
  padding-left: 24px;
  padding-right: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.1);
  color: #888888;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
}

.control-button:hover:not(.disabled) {
  background: rgba(196, 28, 222, 0.3);
}

.control-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button.active {
  background: rgba(196, 28, 222, 0.2);
  color: rgba(196, 28, 222);
  border: 1px solid rgba(196, 28, 222);
}
</style>
