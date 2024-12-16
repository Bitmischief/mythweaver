<script setup lang="ts">
import { computed } from 'vue';
import { Paintbrush, Eraser, Undo, Redo } from 'lucide-vue-next';
import { useImageStore } from '@/modules/images/store/image.store';
import { useImageEditorStore } from '@/modules/images/store/editor.store';
import { storeToRefs } from 'pinia';
import { setImageToEdit } from '@/modules/images/api/images';
import { maskedTools } from '@/modules/images/store/editor.store';

const { selectedImage } = storeToRefs(useImageStore());
const { selectedTool, editing, brushSize, isEraseMode } = storeToRefs(
  useImageEditorStore(),
);

const currentEdit = computed(() => {
  return selectedImage.value?.edits.find(
    (edit: any) => edit.uri === selectedImage.value?.uri,
  );
});

const toggleEditMode = () => {
  isEraseMode.value = false;
};

const toggleEraseMode = () => {
  isEraseMode.value = true;
};

const canUndo = computed(() => {
  if (selectedImage.value?.edits.length > 1) {
    const firstImage = selectedImage.value?.edits[0];
    return currentEdit.value?.id !== firstImage?.id;
  }

  return false;
});

const canRedo = computed(() => {
  if (selectedImage.value?.edits.length > 1) {
    const lastImage = selectedImage.value?.edits.at(-1);
    return currentEdit.value?.id !== lastImage?.id;
  }

  return false;
});

async function undoEdit() {
  if (
    !selectedImage.value ||
    !selectedImage.value?.id ||
    !currentEdit.value?.id
  )
    return;

  try {
    console.log(currentEdit.value);
    const previousEditIndex =
      selectedImage.value.edits.findIndex(
        (edit: any) => edit.id === currentEdit.value.id,
      ) - 1;

    editing.value = true;
    await setImageToEdit(
      selectedImage.value.id,
      selectedImage.value.edits[previousEditIndex].id,
    );

    selectedImage.value.uri = selectedImage.value.edits[previousEditIndex].uri;
  } catch (error) {
    console.error('Error undoing edit:', error);
  } finally {
    editing.value = false;
  }
}

async function redoEdit() {
  if (
    !selectedImage.value ||
    !selectedImage.value?.id ||
    !currentEdit.value?.id
  )
    return;

  try {
    const nextEditIndex =
      selectedImage.value.edits.findIndex(
        (edit: any) => edit.id === currentEdit.value.id,
      ) + 1;

    editing.value = true;
    await setImageToEdit(
      selectedImage.value.id,
      selectedImage.value.edits[nextEditIndex].id,
    );

    selectedImage.value.uri = selectedImage.value.edits[nextEditIndex].uri;
  } catch (error) {
    console.error('Error undoing edit:', error);
  } finally {
    editing.value = false;
  }
}

const disableMask = computed(() => {
  return editing.value || !maskedTools.includes(selectedTool.value);
});
</script>

<template>
  <div class="bg-surface rounded-3xl w-full sm:w-auto sm:rounded-full p-2">
    <div class="sm:flex justify-center items-center">
      <div class="flex justify-center gap-2">
        <div class="text-center">
          <button
            class="control-button"
            :class="{ active: !isEraseMode }"
            :title="isEraseMode ? 'Switch to Brush' : 'Switch to Eraser'"
            :disabled="disableMask"
            @click="toggleEditMode"
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
            @click="toggleEraseMode"
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
              v-model="brushSize"
              :min="5"
              :max="200"
              name="brush-size"
              class="w-36"
              :disabled="disableMask"
            />
          </div>
        </div>
        <div class="flex justify-center gap-2 pl-3 border-l border-neutral-800">
          <button class="control-button" :disabled="!canUndo" @click="undoEdit">
            <Undo class="h-5 w-5" />
          </button>
          <button class="control-button" :disabled="!canRedo" @click="redoEdit">
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
