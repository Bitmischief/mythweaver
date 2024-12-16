<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import BrushControls from '../edit/BrushControls.vue';
import { storeToRefs } from 'pinia';
import ImageEditorTools from '@/modules/images/components/edit/ImageEditorTools.vue';
import ImageEditorToolSelector from '@/modules/images/components/edit/ImageEditorToolSelector.vue';
import ImageEditorCanvas from '@/modules/images/components/edit/ImageEditorCanvas.vue';
import ImageEditorActions from '@/modules/images/components/edit/ImageEditorActions.vue';
import { useImageEditorStore } from '@/modules/images/store/editor.store';

const emit = defineEmits(['close']);
const { selectedImage } = storeToRefs(useImageStore());
const { deleteEdits } = useImageEditorStore();

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
});

const closeModal = async () => {
  try {
    if (selectedImage.value?.id && selectedImage.value?.edits.length) {
      await deleteEdits(selectedImage.value?.id);
    }
  } catch (error) {
    console.error('Error clearing edits:', error);
  } finally {
    emit('close');
  }
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};
</script>

<template>
  <div
    class="flex flex-col min-h-full lg:h-full overflow-y-auto pb-12 md:pb-0 lg:overflow-hidden relative"
  >
    <div class="canvas-background fixed inset-0"></div>

    <header class="sticky top-0 z-20 p-4 lg:p-6 bg-surface/50 backdrop-blur-sm">
      <div
        class="mx-auto flex flex-col lg:flex-row justify-between items-center gap-4"
      >
        <div class="gradient-text text-2xl">Image Editor</div>
        <ImageEditorActions @close="closeModal" />
      </div>
    </header>

    <main class="flex-1 relative">
      <div class="lg:h-full lg:flex lg:gap-4 lg:p-4">
        <div
          class="sticky top-[72px] z-10 mt-4 px-4 lg:p-0 lg:static lg:w-[5em] lg:bg-transparent"
        >
          <ImageEditorToolSelector />
        </div>
        <div
          class="lg:hidden sticky z-10 bg-background/50 backdrop-blur-sm mt-2 px-4"
        >
          <BrushControls />
        </div>
        <ImageEditorCanvas />
        <ImageEditorTools />
      </div>
    </main>

    <footer class="hidden lg:block sticky bottom-0 px-4">
      <div class="flex gap-4 min-h-[5em]">
        <div class="w-[5em]"></div>
        <div class="flex flex-grow justify-center items-center">
          <BrushControls />
        </div>
        <div class="w-[18em]"></div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.canvas-background {
  background-image: radial-gradient(
      rgba(255, 255, 255, 0.05) 2px,
      transparent 2px
    ),
    radial-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px);
  background-size: 25px 25px;
  opacity: 0.5;
  z-index: -1;
  pointer-events: none;
}

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
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
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

img {
  user-select: none;
  pointer-events: none;
  display: block;
}

canvas {
  cursor: none;
}

.flex-grow {
  overflow: hidden;
}

@media (max-width: 768px) {
  canvas {
    touch-action: none; /* Prevents default touch behaviors like scrolling */
  }

  .canvas-container {
    overflow: hidden; /* Prevents scrolling while drawing */
  }
}

@media (max-width: 1024px) {
  .sticky {
    position: sticky;
    backdrop-filter: blur(8px);
  }
}

canvas {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

@media (max-width: 768px) {
  .canvas-container {
    overscroll-behavior: none;
    overflow: hidden;
  }
}
</style>
