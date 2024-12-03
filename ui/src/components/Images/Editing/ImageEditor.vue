<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Inpaint from './Inpaint.vue';
import { Image } from '@/modules/images/types/image';
import Loader from '@/components/Core/Loader.vue';
import Extend from './Extend.vue';
import Erase from './Erase.vue';
import { Download } from 'lucide-vue-next';
import { CheckIcon } from '@heroicons/vue/24/solid';
import Spinner from '@/components/Core/Spinner.vue';
import { Eraser, Fullscreen, Paintbrush, ArrowUpToLine } from 'lucide-vue-next';
import { useDebounceFn } from '@vueuse/core';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import { useEditImage } from '@/modules/images/composables/useEditImage.ts';
import BrushControls from './BrushControls.vue';
import { Dialog, Button } from 'primevue';
import { setImageToEdit, deleteEdits } from '@/api/images';

const emit = defineEmits(['close', 'imageUpdated']);
const imageStore = useImageStore();
const { setSelectedImage } = useEditImage();

const image = computed(() => {
  return imageStore.selectedImage;
});
const imageUrl = computed(() => {
  return imageStore.selectedImage?.uri;
});

const canvasCtx = ref<CanvasRenderingContext2D | null>(null);
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const previewCtx = ref<CanvasRenderingContext2D | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const brushSize = ref<number>(25);
const isEraseMode = ref<boolean>(false);

const maskedModes = ref(['inpaint', 'erase']);
const selectedTool = ref<
  'inpaint' | 'outpaint' | 'erase' | 'upscale' | 'create' | 'history'
>('inpaint');
const tools = [
  { mode: 'inpaint', label: 'Modify', soon: false },
  { mode: 'outpaint', label: 'Extend', soon: false },
  { mode: 'erase', label: 'Erase', soon: false },
  { mode: 'upscale', label: 'Upscale', soon: true },
] as const;

const currentEdit = computed(() => {
  return image.value?.edits.find((edit: any) => edit.uri === image.value?.uri);
});

const canUndo = computed(() => {
  if (image.value?.edits.length > 1) {
    const firstImage = image.value?.edits[0];
    return currentEdit.value?.id !== firstImage?.id;
  }

  return false;
});

const canRedo = computed(() => {
  if (image.value?.edits.length > 1) {
    const lastImage = image.value?.edits.at(-1);
    return currentEdit.value?.id !== lastImage?.id;
  }

  return false;
});

const isDrawing = ref<boolean>(false);
const mouseX = ref<number>(0);
const mouseY = ref<number>(0);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const imageWidth = ref(0);
const imageHeight = ref(0);
const imageAspectRatio = ref(1);
const loadingImage = ref(false);
const editing = ref(false);

const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
  initCanvas();
};

const debouncedResize = useDebounceFn(handleResize, 250);

async function initCanvas() {
  if (
    canvasRef.value &&
    imageRef.value &&
    containerRef.value &&
    previewCanvasRef.value
  ) {
    const container = containerRef.value;
    const img = imageRef.value;
    imageAspectRatio.value = img.naturalWidth / img.naturalHeight;

    const maxAvailableHeight = windowHeight.value - 200;
    const maxAvailableWidth = container.clientWidth;

    let finalWidth = img.naturalWidth;
    let finalHeight = img.naturalHeight;

    const widthRatio = maxAvailableWidth / finalWidth;
    const heightRatio = maxAvailableHeight / finalHeight;
    const scale = Math.min(widthRatio, heightRatio, 1);

    finalWidth *= scale;
    finalHeight *= scale;

    imageWidth.value = finalWidth;
    imageHeight.value = finalHeight;
    canvasWidth.value = finalWidth;
    canvasHeight.value = finalHeight;

    canvasRef.value.width = canvasWidth.value;
    canvasRef.value.height = canvasHeight.value;
    canvasCtx.value = canvasRef.value.getContext('2d');

    previewCanvasRef.value.width = canvasWidth.value;
    previewCanvasRef.value.height = canvasHeight.value;
    previewCtx.value = previewCanvasRef.value.getContext('2d');

    img.style.width = `${finalWidth}px`;
    img.style.height = `${finalHeight}px`;
  }
}

const draw = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  updateBrushPreview(e);
  if (!isDrawing.value || !canvasCtx.value) return;

  const { x, y } = getPointerPos(e);

  canvasCtx.value.beginPath();
  canvasCtx.value.moveTo(mouseX.value, mouseY.value);
  canvasCtx.value.lineTo(x, y);
  canvasCtx.value.strokeStyle = 'rgba(139, 92, 246, 1)';
  canvasCtx.value.lineWidth = brushSize.value;
  canvasCtx.value.lineCap = 'round';
  canvasCtx.value.globalCompositeOperation = isEraseMode.value
    ? 'destination-out'
    : 'source-over';
  canvasCtx.value.stroke();
  [mouseX.value, mouseY.value] = [x, y];
};

const startDrawing = (e: MouseEvent | TouchEvent) => {
  if (selectedTool.value === 'outpaint') {
    return;
  }

  e.preventDefault();
  isDrawing.value = true;
  const { x, y } = getPointerPos(e);
  [mouseX.value, mouseY.value] = [x, y];
  updateBrushPreview(e);
};

const stopDrawing = () => {
  isDrawing.value = false;
};

const updateBrushPreview = (e: MouseEvent | TouchEvent) => {
  if (
    !previewCtx.value ||
    !previewCanvasRef.value ||
    !maskedModes.value.includes(selectedTool.value)
  )
    return;

  const pos = getPointerPos(e);
  let x = Math.min(Math.max(pos.x, 0), canvasWidth.value);
  let y = Math.min(Math.max(pos.y, 0), canvasHeight.value);

  mouseX.value = x;
  mouseY.value = y;

  previewCtx.value.clearRect(
    0,
    0,
    previewCanvasRef.value.width,
    previewCanvasRef.value.height,
  );

  if (x >= 0 && x <= canvasWidth.value && y >= 0 && y <= canvasHeight.value) {
    previewCtx.value.beginPath();
    previewCtx.value.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
    previewCtx.value.fillStyle = isEraseMode.value
      ? 'rgba(255, 25, 25, 0.2)'
      : 'rgba(139, 92, 246, 0.2)';
    previewCtx.value.fill();
    previewCtx.value.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    previewCtx.value.lineWidth = 1;
    previewCtx.value.stroke();
  }
};

const clearPreview = () => {
  if (previewCtx.value && previewCanvasRef.value) {
    previewCtx.value.clearRect(
      0,
      0,
      previewCanvasRef.value.width,
      previewCanvasRef.value.height,
    );
  }
};

const getPointerPos = (e: MouseEvent | TouchEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 };

  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;

  let clientX: number;
  let clientY: number;

  if (e instanceof TouchEvent) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  return {
    x: Math.min(Math.max(x, 0), canvasRef.value.width),
    y: Math.min(Math.max(y, 0), canvasRef.value.height),
  };
};

const closeModal = async () => {
  try {
    if (image.value?.id && image.value?.edits.length) {
      await deleteEdits(image.value?.id);
    }
  } catch (error) {
    console.error('Error clearing edits:', error);
  } finally {
    emit('close');
  }
};

const clearMask = () => {
  if (canvasCtx.value && canvasRef.value) {
    canvasCtx.value.clearRect(
      0,
      0,
      canvasRef.value.width,
      canvasRef.value.height,
    );
  }
};

const toggleEditMode = () => {
  isEraseMode.value = false;
};

const toggleEraseMode = () => {
  isEraseMode.value = true;
};

const setEditMode = (tool: 'inpaint' | 'outpaint' | 'erase') => {
  selectedTool.value = tool;
  if (!maskedModes.value.includes(selectedTool.value)) {
    clearMask();
  }
};

const handleEditStarted = async () => {
  editing.value = true;
};

const handleEditFailed = async () => {
  editing.value = false;
};

const handleEditApplied = async (updatedImage: Image) => {
  await setSelectedImage(updatedImage);
  clearMask();
  editing.value = false;
};

const getMaskCanvas = () => {
  if (canvasRef.value && canvasCtx.value) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.value.width;
    tempCanvas.height = canvasRef.value.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.drawImage(canvasRef.value, 0, 0);

      const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height,
      );
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0) {
          data[i] = 255; // Full red
          data[i + 1] = 255; // Full green
          data[i + 2] = 255; // Full blue
        }
      }

      tempCtx.putImageData(imageData, 0, 0);

      return tempCanvas;
    }
  }
  return null;
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  }
};

const downloadImage = async () => {
  if (!imageUrl.value) return;

  try {
    const response = await fetch(imageUrl.value);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${image.value?.id || 'download'}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
  }
};

const showUpscaleDialog = ref(false);

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
  window.addEventListener('resize', debouncedResize);
  initCanvas();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  window.removeEventListener('resize', debouncedResize);
});

async function undoEdit() {
  if (!image.value || !image.value?.id || !currentEdit.value?.id) return;

  try {
    console.log(currentEdit.value);
    const previousEditIndex =
      image.value.edits.findIndex(
        (edit: any) => edit.id === currentEdit.value.id,
      ) - 1;

    editing.value = true;
    await setImageToEdit(
      image.value.id,
      image.value.edits[previousEditIndex].id,
    );

    image.value.uri = image.value.edits[previousEditIndex].uri;
    await handleEditApplied(image.value);
  } catch (error) {
    console.error('Error undoing edit:', error);
  } finally {
    editing.value = false;
  }
}

async function redoEdit() {
  if (!image.value || !image.value?.id || !currentEdit.value?.id) return;

  try {
    const nextEditIndex =
      image.value.edits.findIndex(
        (edit: any) => edit.id === currentEdit.value.id,
      ) + 1;

    editing.value = true;
    await setImageToEdit(image.value.id, image.value.edits[nextEditIndex].id);

    image.value.uri = image.value.edits[nextEditIndex].uri;
    await handleEditApplied(image.value);
  } catch (error) {
    console.error('Error undoing edit:', error);
  } finally {
    editing.value = false;
  }
}
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
        <div class="flex gap-2 items-center">
          <div
            v-if="!loadingImage && !editing"
            class="hidden lg:flex gap-1 text-sm rounded-[12px] px-4 py-2 text-neutral-500"
          >
            <CheckIcon class="w-3 h-3 self-center" />
            Saved
          </div>
          <div
            v-else
            class="flex gap-1 text-sm rounded-[12px] px-4 py-2 text-neutral-500"
          >
            <Spinner class="w-3 h-3 self-center animate-spin" />
            Saving
          </div>
          <button
            class="bg-[#CC52C0]/20 hover:bg-[#CC52C0]/40 text-[#CC52C0] flex items-center px-4 py-2 rounded-full"
            :disabled="editing"
            @click="downloadImage"
          >
            <Download class="w-5 h-5 mr-2" />
            Download
          </button>
          <button
            class="button-purple rounded-full"
            :disabled="editing"
            @click="closeModal"
          >
            Done
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 relative">
      <div class="lg:h-full lg:flex lg:gap-4 lg:p-4">
        <div
          class="sticky top-[72px] z-10 mt-4 px-4 lg:p-0 lg:static lg:w-[5em] lg:bg-transparent"
        >
          <div
            class="flex lg:flex-col w-full gap-2 justify-between rounded-2xl p-2 bg-surface"
          >
            <div
              v-for="(tool, i) in tools"
              :key="`tool_${i}`"
              class="text-neutral-500"
            >
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
                    : setEditMode(tool.mode)
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
                  >Soon</span
                >
              </button>
            </div>
          </div>
        </div>

        <div
          class="lg:hidden sticky z-10 bg-background/50 backdrop-blur-sm mt-2 px-4"
        >
          <BrushControls
            v-model:brush-size="brushSize"
            :disable-mask="selectedTool === 'outpaint'"
            :is-erase-mode="isEraseMode"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @toggle-edit-mode="toggleEditMode"
            @toggle-erase-mode="toggleEraseMode"
            @clear-mask="clearMask"
            @undo="undoEdit"
            @redo="redoEdit"
            @update-brush-preview="updateBrushPreview"
            @clear-preview="clearPreview"
          />
        </div>

        <div
          ref="containerRef"
          class="flex-1 relative min-h-[50vh] lg:h-full mt-4 lg:mt-0 flex items-center justify-center px-2 lg:px-0"
        >
          <div
            v-if="loadingImage || editing"
            class="absolute inset-0 flex justify-center items-center z-50"
          >
            <div class="flex flex-col items-center">
              <Loader />
              <div class="mt-2 text-center">Loading...</div>
            </div>
          </div>

          <div class="relative">
            <img
              ref="imageRef"
              :src="imageUrl || ''"
              alt="editor image"
              :style="{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
              }"
              :class="{ 'opacity-60': editing }"
              @load="initCanvas"
            />
            <canvas
              ref="canvasRef"
              :width="imageWidth"
              :height="imageHeight"
              class="absolute top-0 left-0"
              :style="{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
              }"
              @mousedown="startDrawing"
              @mousemove="draw"
              @mouseup="stopDrawing"
              @mouseleave="clearPreview"
              @mouseenter="updateBrushPreview"
              @touchstart="startDrawing"
              @touchmove="draw"
              @touchend="stopDrawing"
              @touchcancel="stopDrawing"
            />
            <canvas
              ref="previewCanvasRef"
              :width="imageWidth"
              :height="imageHeight"
              class="absolute top-0 left-0 pointer-events-none"
              :style="{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
              }"
              @mousemove="updateBrushPreview"
              @mouseleave="clearPreview"
              @touchmove="updateBrushPreview"
              @touchend="clearPreview"
            />
          </div>
        </div>

        <div
          v-if="
            image && ['inpaint', 'outpaint', 'erase'].includes(selectedTool)
          "
          class="px-4 lg:w-[18em] lg:shrink-0 overflow-y-auto"
        >
          <Inpaint
            v-if="selectedTool === 'inpaint'"
            :image-id="image.id"
            :get-mask-canvas="getMaskCanvas"
            @edit-applied="handleEditApplied"
            @edit-started="handleEditStarted"
            @edit-failed="handleEditFailed"
          />
          <Extend
            v-if="selectedTool === 'outpaint'"
            :image-id="image.id"
            @edit-applied="handleEditApplied"
            @edit-started="handleEditStarted"
            @edit-failed="handleEditFailed"
          />
          <Erase
            v-if="selectedTool === 'erase'"
            :image-id="image.id"
            :get-mask-canvas="getMaskCanvas"
            @edit-applied="handleEditApplied"
            @edit-started="handleEditStarted"
            @edit-failed="handleEditFailed"
          />
        </div>
      </div>
    </main>

    <footer class="hidden lg:block sticky bottom-0 px-4">
      <div class="flex gap-4 min-h-[5em]">
        <div class="w-[5em]"></div>
        <div class="flex flex-grow justify-center items-center">
          <BrushControls
            v-model:brush-size="brushSize"
            :disable-mask="selectedTool === 'outpaint'"
            :is-erase-mode="isEraseMode"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @toggle-edit-mode="toggleEditMode"
            @toggle-erase-mode="toggleEraseMode"
            @clear-mask="clearMask"
            @undo="undoEdit"
            @redo="redoEdit"
            @update-brush-preview="updateBrushPreview"
            @clear-preview="clearPreview"
          />
        </div>
        <div class="w-[18em]"></div>
      </div>
    </footer>
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
