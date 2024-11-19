<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { FormKit } from '@formkit/vue';
import Inpaint from './Inpaint.vue';
import { Image } from '@/api/images';
import Loader from '@/components/Core/Loader.vue';
import Extend from './Extend.vue';
import Erase from './Erase.vue';
import { CheckIcon } from '@heroicons/vue/24/solid';
import Spinner from '@/components/Core/Spinner.vue';
import {
  Eraser,
  Fullscreen,
  Paintbrush,
  Undo,
  Redo,
  X,
  ImagePlus,
  History,
} from 'lucide-vue-next';
import { useDebounceFn } from '@vueuse/core';
import GenerateImage from '@/modules/images/components/GenerateImage.vue';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import ImageHistory from '@/modules/images/components/ImageHistory.vue';

const emit = defineEmits(['close', 'imageUpdated']);
const imageStore = useImageStore();

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
  { mode: 'create', label: 'New' },
  { mode: 'history', label: 'History' },
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

  let x = 0;
  let y = 0;
  const pos = getMousePos(e);
  mouseX.value = pos.x;
  mouseY.value = pos.y;
  x = pos.x;
  y = pos.y;

  if (x < 0 || x > canvasWidth.value || y < 0 || y > canvasHeight.value) {
    x = canvasWidth.value / 2;
    y = canvasWidth.value / 2;
  }

  previewCtx.value.clearRect(
    0,
    0,
    previewCanvasRef.value.width,
    previewCanvasRef.value.height,
  );
  previewCtx.value.beginPath();
  previewCtx.value.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
  previewCtx.value.fillStyle = isEraseMode.value
    ? 'rgba(255, 25, 25, 0.2)'
    : 'rgba(139, 92, 246, 0.2)';
  previewCtx.value.fill();
  previewCtx.value.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  previewCtx.value.lineWidth = 1;
  previewCtx.value.stroke();
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
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
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

const setEditMode = (
  tool: 'inpaint' | 'outpaint' | 'erase' | 'create' | 'history',
) => {
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
  imageStore.setSelectedImage(updatedImage);
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
    class="overflow-hidden h-[calc(100vh-2.05rem)] m-3 p-3 py-16 rounded-lg flex flex-col"
  >
    <div class="canvas-background absolute inset-0"></div>
    <div
      class="fixed top-0 left-0 right-0 py-6 px-3 flex justify-between items-center"
    >
      <div class="px-4 gradient-text text-2xl">Image Editor</div>
      <div class="flex gap-2 mr-2">
        <div
          v-if="!loadingImage && !editing"
          class="flex gap-1 text-sm rounded-[12px] px-4 py-2 self-center text-neutral-500"
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
          class="button-purple rounded-full z-50"
          :disabled="editing"
          @click="closeModal"
        >
          Done
        </button>
      </div>
    </div>
    <div class="flex gap-4 h-full max-h-[calc(100vh-9em)]">
      <div class="w-[5em] mx-4 shrink-0">
        <div class="bg-surface rounded-2xl p-2">
          <div
            v-for="(tool, i) in tools"
            :key="`tool_${i}`"
            class="text-neutral-500"
          >
            <button
              class="p-2 mb-2 rounded-lg text-sm cursor-pointer flex flex-col items-center justify-center aspect-square w-full"
              :class="{
                'bg-fuchsia-800/25 text-fuchsia-600':
                  selectedTool === tool.mode && tool.mode === 'inpaint',
                'bg-yellow-800/25 text-yellow-600':
                  selectedTool === tool.mode && tool.mode === 'outpaint',
                'bg-blue-800/25 text-blue-600':
                  selectedTool === tool.mode && tool.mode === 'erase',
                'bg-green-800/25 text-green-600':
                  selectedTool === tool.mode && tool.mode === 'create',
                'bg-pink-800/25 text-pink-600':
                  selectedTool === tool.mode && tool.mode === 'history',
                'bg-surface': selectedTool !== tool.mode,
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
              <template v-if="tool.mode === 'create'">
                <ImagePlus class="h-5 w-5" />
              </template>
              <template v-if="tool.mode === 'history'">
                <History class="h-5 w-5" />
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
        class="flex-grow flex justify-center relative items-center"
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
        v-show="selectedTool === 'create'"
        class="flex-grow justify-center bg-surface rounded-2xl p-4"
      >
        <div class="text-lg text-neutral-300 border-b border-neutral-900 mb-4">
          Generate New Image
        </div>
        <GenerateImage
          :allow-edits="false"
          :linking="{
            conjurationId: image?.conjurationId,
            sessionId: image?.sessionId,
            characterId: image?.characterId,
          }"
        />
      </div>
      <div
        v-show="selectedTool === 'history'"
        class="flex-grow justify-center bg-surface rounded-2xl p-4 flex flex-col"
      >
        <div class="text-lg text-neutral-300 border-b border-neutral-900 mb-4">
          Image History
        </div>
        <div class="flex overflow-y-auto">
          <ImageHistory :conjuration-id="image?.conjurationId" />
        </div>
      </div>
      <div
        v-if="
          selectedTool === 'inpaint' ||
          selectedTool === 'outpaint' ||
          selectedTool === 'erase'
        "
        class="w-[18em] px-4 shrink-0 overflow-y-auto"
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
    <div class="flex gap-4 min-h-[5em]">
      <div class="w-[5em]"></div>
      <div class="flex flex-grow justify-center items-center">
        <div
          v-if="maskedModes?.includes(selectedTool)"
          class="bg-surface rounded-full p-2"
        >
          <div class="flex items-center">
            <div class="flex justify-center gap-2">
              <div class="text-center">
                <button
                  class="control-button"
                  :class="{ active: !isEraseMode }"
                  :title="isEraseMode ? 'Switch to Brush' : 'Switch to Eraser'"
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
                  @click="toggleEraseMode"
                >
                  <Eraser class="h-5 w-5" />
                </button>
              </div>
            </div>
            <div class="pr-4">
              <FormKit
                v-model="brushSize"
                :value="brushSize"
                :min="5"
                :max="200"
                type="range"
                name="brush-size"
                help-text="Adjust the size of your brush"
                outer-class="$reset mb-0 mx-2 py-1 px-3 bg-surface-3 rounded-full"
                input-class="!bg-surface-2 !rounded-full !m-0"
                @mousemove="updateBrushPreview"
                @mouseleave="clearPreview"
              />
            </div>
            <div
              class="flex justify-center gap-2 border-l-2 border-neutral-900 pl-6"
            >
              <div class="text-center">
                <button
                  class="control-button"
                  :disabled="!canUndo"
                  :class="{ disabled: !canUndo }"
                  title="Undo"
                  @click="undo"
                >
                  <Undo class="h-5 w-5" />
                </button>
              </div>
              <div class="text-center">
                <button
                  class="control-button"
                  :disabled="!canRedo"
                  :class="{ disabled: !canRedo }"
                  title="Redo"
                  @click="redo"
                >
                  <Redo class="h-5 w-5" />
                </button>
              </div>
              <div class="text-center">
                <button
                  class="control-button"
                  title="Clear mask"
                  @click="clearMask"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
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

:deep(.formkit-input[type='range']) {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 16px;
  margin: 0.5em 1em;
  background-color: transparent;
}

:deep(.formkit-input[type='range']::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgb(196, 28, 222);
  cursor: pointer;
}

:deep(.formkit-input[type='range']::-webkit-slider-runnable-track) {
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
}

:deep(.formkit-input[type='range']::-moz-range-thumb) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgb(196, 28, 222);
  cursor: pointer;
}

:deep(.formkit-input[type='range']:hover) {
  opacity: 1;
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
