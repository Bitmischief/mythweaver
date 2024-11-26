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
import { Eraser, Fullscreen, Paintbrush } from 'lucide-vue-next';
import { useDebounceFn } from '@vueuse/core';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import { useEditImage } from '@/modules/images/composables/useEditImage.ts';
import BrushControls from './BrushControls.vue';

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

const maxStackSize = 25;
const brushSize = ref<number>(25);
const isEraseMode = ref<boolean>(false);

const maskedModes = ref(['inpaint', 'erase']);
const selectedTool = ref<
  'inpaint' | 'outpaint' | 'erase' | 'create' | 'history'
>('inpaint');
const tools = [
  { mode: 'inpaint', label: 'Modify' },
  { mode: 'outpaint', label: 'Extend' },
  { mode: 'erase', label: 'Erase' },
] as const;
const undoStack = ref<ImageData[]>([]);
const redoStack = ref<ImageData[]>([]);

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

    if (undoStack.value.length > 0) {
      const lastState = undoStack.value[undoStack.value.length - 1];
      loadCanvasState(lastState);
    }
  }
}

const draw = (e: MouseEvent) => {
  updateBrushPreview(e);
  if (!isDrawing.value || !canvasCtx.value) return;

  const { x, y } = getMousePos(e);

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

const startDrawing = (e: MouseEvent) => {
  if (selectedTool.value === 'outpaint') {
    return;
  }

  isDrawing.value = true;
  const { x, y } = getMousePos(e);
  [mouseX.value, mouseY.value] = [x, y];
  updateBrushPreview(e);
};

const stopDrawing = () => {
  if (isDrawing.value) {
    saveCanvasState();
  }
  isDrawing.value = false;
};

function saveCanvasState() {
  if (!canvasCtx.value || !canvasRef.value) return;

  const imageData = canvasCtx.value.getImageData(
    0,
    0,
    canvasRef.value.width,
    canvasRef.value.height,
  );
  undoStack.value.push(imageData);

  if (undoStack.value.length > maxStackSize) {
    undoStack.value.shift();
  }

  redoStack.value = [];
}

const updateBrushPreview = (e: MouseEvent) => {
  if (!previewCtx.value || !previewCanvasRef.value) return;

  const pos = getMousePos(e);
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

const getMousePos = (e: MouseEvent) => {
  if (!canvasRef.value) return { x: 0, y: 0 };
  const rect = canvasRef.value.getBoundingClientRect();
  const scaleX = canvasRef.value.width / rect.width;
  const scaleY = canvasRef.value.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
};

const closeModal = () => {
  emit('close');
};

const undo = () => {
  if (undoStack.value.length <= 1) return; // Keep at least initial state
  const currentState = undoStack.value.pop();
  if (currentState) {
    redoStack.value.push(currentState);
    const previousState = undoStack.value[undoStack.value.length - 1];
    loadCanvasState(previousState);
  }
};

const redo = () => {
  const nextState = redoStack.value.pop();
  if (nextState) {
    undoStack.value.push(nextState);
    loadCanvasState(nextState);
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
    saveCanvasState();
  }
};

function loadCanvasState(imageData: ImageData) {
  if (!canvasCtx.value) return;
  canvasCtx.value.putImageData(imageData, 0, 0);
}

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

const canUndo = computed(() => undoStack.value.length > 1);
const canRedo = computed(() => redoStack.value.length > 0);

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

onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey);
  window.addEventListener('resize', debouncedResize);
  initCanvas();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
  window.removeEventListener('resize', debouncedResize);
});
</script>

<template>
  <div
    class="h-[calc(100vh-2.05rem)] md:m-3 md:p-3 md:py-16 rounded-lg flex flex-col"
  >
    <div class="canvas-background absolute inset-0"></div>
    <div
      class="fixed top-0 left-0 right-0 py-6 px-3 md:flex justify-between items-center"
    >
      <div class="px-4 gradient-text text-center md:text-left text-2xl">
        Image Editor
      </div>
      <div class="mt-2 md:mt-0 flex gap-2 justify-center items-center mr-2">
        <div
          v-if="!loadingImage && !editing"
          class="hidden md:flex gap-1 text-sm rounded-[12px] px-4 py-2 self-center text-neutral-500"
        >
          <CheckIcon class="w-3 h-3 self-center" />
          Saved
        </div>
        <div
          v-else
          class="flex gap-1 text-sm rounded-[12px] px-4 py-2 self-center text-neutral-500"
        >
          <Spinner class="w-3 h-3 self-center animate-spin" />
          Saving
        </div>
        <button
          class="bg-[#CC52C0]/20 hover:bg-[#CC52C0]/40 text-[#CC52C0] flex items-center px-4 py-2 rounded-full z-50"
          :disabled="editing"
          @click="downloadImage"
        >
          <Download class="w-5 h-5 mr-2" />
          Download
        </button>
        <button
          class="button-purple rounded-full z-50"
          :disabled="editing"
          @click="closeModal"
        >
          Done
        </button>
      </div>
    </div>
    <div class="md:flex w-full md:gap-4 h-full md:max-h-[calc(100vh-9em)]">
      <div class="mt-32 md:mt-0 md:w-[5em] mx-4 shrink-0">
        <div
          class="bg-surface flex md:flex-col gap-2 justify-between rounded-2xl p-2"
        >
          <div
            v-for="(tool, i) in tools"
            :key="`tool_${i}`"
            class="text-neutral-500"
          >
            <button
              class="p-2 rounded-lg text-sm cursor-pointer flex flex-col items-center justify-center aspect-square w-full"
              :class="{
                'bg-fuchsia-800/25 text-fuchsia-600':
                  selectedTool === tool.mode && tool.mode === 'inpaint',
                'bg-yellow-800/25 text-yellow-600':
                  selectedTool === tool.mode && tool.mode === 'outpaint',
                'bg-blue-800/25 text-blue-600':
                  selectedTool === tool.mode && tool.mode === 'erase',
              }"
              @click="setEditMode(tool.mode)"
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
              {{ tool.label }}
            </button>
          </div>
        </div>
      </div>
      <div
        v-if="
          selectedTool === 'inpaint' ||
          selectedTool === 'outpaint' ||
          selectedTool === 'erase'
        "
        ref="containerRef"
        class="md:flex-grow mt-2 w-full h-[315px] md:h-auto md:mt-0 md:flex md:justify-center relative md:items-center"
      >
        <div
          v-if="loadingImage || editing"
          class="absolute flex justify-center h-full w-full z-50"
        >
          <div class="flex flex-col justify-center">
            <Loader />
            <div class="mt-2 text-center">Loading...</div>
          </div>
        </div>
        <img
          ref="imageRef"
          :src="imageUrl || ''"
          alt="editor image"
          class="w-full"
          :class="{ 'opacity-60': editing }"
          @load="initCanvas"
        />
        <canvas
          ref="canvasRef"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing"
          @mouseleave="
            () => {
              stopDrawing();
              clearPreview();
            }
          "
        />
        <canvas
          ref="previewCanvasRef"
          class="pointer-events-none"
          @mousemove="updateBrushPreview"
          @mouseleave="clearPreview"
        />
      </div>
      <div
        v-if="
          (image && selectedTool === 'inpaint') ||
          (image && selectedTool === 'outpaint') ||
          (image && selectedTool === 'erase')
        "
        class="mt-4 md:mt-0 md:w-[18em] px-4 shrink-0 overflow-y-auto"
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
    <div class="hidden md:flex gap-4 min-h-[5em]">
      <div class="w-[5em]"></div>
      <div class="flex flex-grow justify-center items-center">
        <BrushControls
          v-if="maskedModes?.includes(selectedTool)"
          v-model:brush-size="brushSize"
          :is-erase-mode="isEraseMode"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @toggle-edit-mode="toggleEditMode"
          @toggle-erase-mode="toggleEraseMode"
          @clear-mask="clearMask"
          @undo="undo"
          @redo="redo"
          @update-brush-preview="updateBrushPreview"
          @clear-preview="clearPreview"
        />
      </div>
      <div class="w-[18em]"></div>
    </div>
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
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  user-select: none;
  pointer-events: none;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: none;
  max-width: 100%;
  max-height: 100%;
}

.flex-grow {
  overflow: hidden;
}
</style>
