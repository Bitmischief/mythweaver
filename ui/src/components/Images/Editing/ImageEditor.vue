<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { FormKit } from '@formkit/vue';
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline';
import Inpaint from './Inpaint.vue';
import { Image, patchPrimaryImage } from '@/api/images';
import Loader from '@/components/Core/Loader.vue';
import Extend from './Extend.vue';
import Erase from './Erase.vue';
import { useEventBus } from '@/lib/events.ts';
import { CheckIcon, CircleStackIcon } from '@heroicons/vue/24/solid';
import Spinner from '@/components/Core/Spinner.vue';

const props = defineProps<{
  image: any;
}>();

const eventBus = useEventBus();
const emit = defineEmits(['close', 'imageUpdated']);

const image = ref<Image | null>(props.image);
const imageUrl = ref<string | null>(props.image.uri);

const canvasCtx = ref<CanvasRenderingContext2D | null>(null);
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const previewCtx = ref<CanvasRenderingContext2D | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const maxStackSize = 25;
const brushSize = ref<number>(25);
const isEraseMode = ref<boolean>(false);

const selectedTool = ref<'inpaint' | 'outpaint' | 'erase'>('inpaint');
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

    if (img.naturalWidth > container.clientWidth) {
      img.style.height = `${img.naturalHeight / imageAspectRatio.value}px`;
    }

    imageWidth.value = img.clientWidth;
    imageHeight.value = img.clientHeight;

    canvasWidth.value = img.clientWidth;
    canvasHeight.value = img.clientHeight;

    canvasRef.value.width = canvasWidth.value;
    canvasRef.value.height = canvasHeight.value;
    canvasCtx.value = canvasRef.value.getContext('2d');

    previewCanvasRef.value.width = canvasWidth.value;
    previewCanvasRef.value.height = canvasHeight.value;
    previewCtx.value = previewCanvasRef.value.getContext('2d');
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

const updateBrushSize = (e: any) => {
  console.log(e);
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
  if (selectedTool.value === 'outpaint') {
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
  image.value = updatedImage;
  imageUrl.value = updatedImage.uri;
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
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey);
});
</script>

<template>
  <div class="overflow-hidden h-full flex flex-col border border-zinc-700">
    <div class="canvas-background absolute inset-0"></div>
    <div
      class="fixed top-0 left-0 right-0 py-2 flex justify-between items-center"
    >
      <div class="px-4 gradient-text text-2xl">Image Editor</div>
      <div class="flex gap-2 mr-2">
        <div v-if="!loadingImage && !editing" class="bg-neutral-800/40 flex gap-1 rounded p-1 px-3 self-center text-neutral-500">
          <CheckIcon class="w-3 h-3 self-center" />
          Saved
        </div>
        <div v-else class="bg-neutral-800/40 flex gap-1 rounded p-1 px-3 self-center text-neutral-500">
          <Spinner class="w-3 h-3 self-center animate-spin" />
          Saving
        </div>
        <button
          class="button-primary z-50 text-green-500"
          :disabled="editing"
          @click="closeModal"
        >
          Continue
        </button>
      </div>
    </div>
    <div class="flex gap-4 h-full">
      <div class="min-w-[12em] p-4 mt-12">
        <div v-for="(tool, i) in tools" :key="`tool_${i}`">
          <button
            class="px-3 py-2 mb-2 rounded-lg w-full cursor-pointer"
            :class="{
              'bg-gradient': selectedTool === tool.mode,
              'bg-zinc-800': selectedTool !== tool.mode,
            }"
            @click="setEditMode(tool.mode)"
          >
            {{ tool.label }}
          </button>
        </div>
        <div>
          <Transition
            enter-active-class="transition-left duration-200 linear"
            enter-from-class="-left-[100%]"
            enter-to-class="left-0"
            leave-active-class="transition-left duration-200 linear"
            leave-from-class="left-0"
            leave-to-class="-left-[100%]"
          >
            <div v-if="selectedTool !== 'outpaint'" class="fixed min-w-[12em]">
              <div class="mt-2">
                <div class="">
                  <span class="text-xs">Brush Size ({{ brushSize }}px)</span>
                  <div class="flex">
                    <FormKit
                      v-model="brushSize"
                      type="range"
                      :min="5"
                      :max="200"
                      name="brush-size"
                      label="Brush Size"
                      help-text="Adjust the size of your brush"
                      :value="brushSize"
                      @input="updateBrushSize"
                      @mousemove="updateBrushPreview"
                      @mouseleave="clearPreview"
                      input-class="formkit-input[type='range']"
                    />
                  </div>
                </div>
                <div class="flex justify-center gap-4 mt-2">
                  <div class="text-center">
                    <span class="text-xs">Undo</span>
                    <button
                      class="control-button"
                      :disabled="!canUndo"
                      :class="{ disabled: !canUndo }"
                      title="Undo"
                      @click="undo"
                    >
                      <ArrowUturnLeftIcon class="h-5 w-5" />
                    </button>
                  </div>
                  <div class="text-center">
                    <span class="text-xs">Redo</span>
                    <button
                      class="control-button"
                      :disabled="!canRedo"
                      :class="{ disabled: !canRedo }"
                      title="Redo"
                      @click="redo"
                    >
                      <ArrowUturnRightIcon class="h-5 w-5" />
                    </button>
                  </div>
                  <div class="text-center">
                    <span class="text-xs">Clear</span>
                    <button
                      class="control-button"
                      title="Clear mask"
                      @click="clearMask"
                    >
                      <XMarkIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div class="flex justify-center gap-4 mt-2">
                  <div class="text-center">
                    <span class="text-xs">Draw</span>
                    <button
                      class="control-button"
                      :class="{ active: !isEraseMode }"
                      :title="
                        isEraseMode ? 'Switch to Brush' : 'Switch to Eraser'
                      "
                      @click="toggleEditMode"
                    >
                      <PencilIcon class="h-5 w-5" />
                    </button>
                  </div>
                  <div class="text-center">
                    <span class="text-xs">Erase</span>
                    <button
                      class="control-button"
                      :class="{ active: isEraseMode }"
                      :title="
                        isEraseMode ? 'Switch to Brush' : 'Switch to Eraser'
                      "
                      @click="toggleEraseMode"
                    >
                      <TrashIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
      <div ref="containerRef" class="flex-grow justify-center relative h-full">
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
          class="h-full"
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
      <div class="w-[18em] mt-16 bg-neutral-800 rounded-tl-3xl p-4">
        <Transition
          enter-active-class="transition-right duration-200 linear"
          enter-from-class="-right-[100%]"
          enter-to-class="right-10"
          leave-active-class="transition-right duration-200 linear"
          leave-from-class="right-10"
          leave-to-class="-right-[100%]"
        >
          <Inpaint 
            v-if="selectedTool === 'inpaint'"
            :image-id="props.image.id"
            :get-mask-canvas="getMaskCanvas"
            @edit-applied="handleEditApplied"
            @edit-started="handleEditStarted"
            @edit-failed="handleEditFailed"
          />
        </Transition>
        <Transition
          enter-active-class="transition-right duration-200 linear"
          enter-from-class="-right-[100%]"
          enter-to-class="right-10"
          leave-active-class="transition-right duration-200 linear"
          leave-from-class="right-10"
          leave-to-class="-right-[100%]"
        >
          <Extend
            v-if="selectedTool === 'outpaint'"
            :image-id="props.image.id"
            @edit-applied="handleEditApplied"
            @edit-started="handleEditStarted"
            @edit-failed="handleEditFailed"
          />
        </Transition>
        <Transition
          enter-active-class="transition-right duration-200 linear"
          enter-from-class="-right-[100%]"
          enter-to-class="right-10"
          leave-active-class="transition-right duration-200 linear"
          leave-from-class="right-10"
          leave-to-class="-right-[100%]"
        >
          <Erase
              v-if="selectedTool === 'erase'"
            :image-id="props.image.id"
            :get-mask-canvas="getMaskCanvas"
            @edit-applied="handleEditApplied"
            @edit-started="handleEditStarted"
            @edit-failed="handleEditFailed"
          />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-background {
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px
    ),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.5;
  z-index: -1;
}

.control-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-button:hover:not(.disabled) {
  background: rgba(139, 92, 246, 0.3);
}

.control-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-button svg {
  width: 20px;
  height: 20px;
}

.control-button.active {
  background: rgba(139, 92, 246, 0.3);
}

:deep(.formkit-input[type="range"]) {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(139, 92, 246, 0.2);
  outline: none;
  opacity: 0.7;
  transition: opacity 0.2s;
  margin: 0.5em 1em;
}

:deep(.formkit-input[type="range"]::-webkit-slider-thumb) {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(139, 92, 246);
  cursor: pointer;
}

:deep(.formkit-input[type="range"]::-moz-range-thumb) {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(139, 92, 246);
  cursor: pointer;
}

:deep(.formkit-input[type="range"]:hover) {
  opacity: 1;
}

img {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
  user-select: none;
  pointer-events: none;
}

canvas {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, 0);
}
</style>
