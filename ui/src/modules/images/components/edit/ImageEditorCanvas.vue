<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Loader from '@/components/Core/Loader.vue';
import { useDebounceFn } from '@vueuse/core';
import { useImageStore } from '@/modules/images/store/image.store.ts';
import { storeToRefs } from 'pinia';
import { useImageEditorStore } from '@/modules/images/store/editor.store.ts';
import { maskedTools } from '@/modules/images/store/editor.store';

const { selectedImage } = storeToRefs(useImageStore());
const { editing, selectedTool, canvasMask, brushSize, isEraseMode } =
  storeToRefs(useImageEditorStore());

const canvasCtx = ref<CanvasRenderingContext2D | null>(null);
const previewCanvasRef = ref<HTMLCanvasElement | null>(null);
const previewCtx = ref<CanvasRenderingContext2D | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isDrawing = ref<boolean>(false);
const mouseX = ref<number>(0);
const mouseY = ref<number>(0);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const imageWidth = ref(0);
const imageHeight = ref(0);
const imageAspectRatio = ref(1);
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

onMounted(() => {
  window.addEventListener('resize', debouncedResize);
  initCanvas();
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize);
});

watch(brushSize, () => {
  updateBrushPreview(null);
});

watch(canvasMask, async () => {
  if (!canvasMask.value) {
    clearCanvasMask();
  }
});

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
  setCanvasMask();
};

const updateBrushPreview = (e: MouseEvent | TouchEvent | null) => {
  if (
    !previewCtx.value ||
    !previewCanvasRef.value ||
    !maskedTools.includes(selectedTool.value)
  )
    return;

  const pos = !e
    ? { x: canvasWidth.value / 2, y: canvasHeight.value / 2 }
    : getPointerPos(e);
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

const setCanvasMask = () => {
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

      canvasMask.value = tempCanvas;
    }
  }
};

const clearCanvasMask = () => {
  if (canvasRef.value && canvasCtx.value) {
    canvasCtx.value.clearRect(
      0,
      0,
      canvasRef.value.width,
      canvasRef.value.height,
    );
  }
};
</script>

<template>
  <div
    ref="containerRef"
    class="flex-1 relative min-h-[50vh] lg:h-full my-4 lg:mt-0 flex items-center justify-center px-2 lg:px-0"
  >
    <div
      v-if="editing"
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
        :src="selectedImage?.uri || ''"
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
</template>
