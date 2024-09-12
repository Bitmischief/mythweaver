<script lang="ts" setup>
import { onMounted, ref } from 'vue';

defineProps<{ imageSrc: string }>();

const image = ref<HTMLImageElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const drawing = ref(false);
const context = ref<CanvasRenderingContext2D | null>(null);
const startX = ref(0);
const startY = ref(0);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const brushSize = ref(10); // Configurable brush size
const devicePixelRatio = window.devicePixelRatio || 1;

const vibrantPurple = 'rgba(128, 0, 128, 0.8)'; // Vibrant purple color
const cursor = ref<HTMLDivElement | null>(null); // Ref for the purple circle cursor

const onImageLoad = () => {
  const img = image.value;
  const canvasEl = canvas.value;
  if (!img || !canvasEl) return;

  // Set canvas size to match the image dimensions with respect to the devicePixelRatio
  canvasWidth.value = img.clientWidth * devicePixelRatio;
  canvasHeight.value = img.clientHeight * devicePixelRatio;

  canvasEl.width = canvasWidth.value;
  canvasEl.height = canvasHeight.value;

  canvasEl.style.width = `${img.clientWidth}px`;
  canvasEl.style.height = `${img.clientHeight}px`;

  context.value = canvasEl.getContext('2d');
  if (context.value) {
    context.value.scale(devicePixelRatio, devicePixelRatio); // Adjust for high-DPI displays
    context.value.fillStyle = vibrantPurple;
  }

  canvasEl.addEventListener('mousedown', startDrawing);
  canvasEl.addEventListener('mousemove', draw);
  canvasEl.addEventListener('mouseup', stopDrawing);
  canvasEl.addEventListener('mousemove', updateCursor); // Update cursor movement
};

const getMousePos = (event: MouseEvent) => {
  const canvasEl = canvas.value;
  if (!canvasEl) return { x: 0, y: 0 };

  // Get the canvas's position relative to the viewport
  const rect = canvasEl.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

const startDrawing = (event: MouseEvent) => {
  drawing.value = true;
  const pos = getMousePos(event);
  startX.value = pos.x;
  startY.value = pos.y;
  drawCircle(startX.value, startY.value); // Draw the initial circle
};

const draw = (event: MouseEvent) => {
  if (!drawing.value) return;

  const pos = getMousePos(event);
  const offsetX = pos.x;
  const offsetY = pos.y;

  // Calculate the distance between the previous point and the new point
  const dx = offsetX - startX.value;
  const dy = offsetY - startY.value;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Draw circles along the path between the two points to avoid gaps
  const steps = Math.ceil(distance / (brushSize.value / 2));
  for (let i = 0; i <= steps; i++) {
    const x = startX.value + (dx * i) / steps;
    const y = startY.value + (dy * i) / steps;
    drawCircle(x, y);
  }

  startX.value = offsetX;
  startY.value = offsetY;
};

const drawCircle = (x: number, y: number) => {
  if (!context.value) return;

  context.value.beginPath();
  context.value.arc(x, y, brushSize.value / 2, 0, Math.PI * 2);
  context.value.fillStyle = vibrantPurple; // Use vibrant purple for drawing
  context.value.fill();
};

const stopDrawing = () => {
  drawing.value = false;
};

const clearCanvas = () => {
  const canvasEl = canvas.value;
  if (!context.value || !canvasEl) return;
  context.value.clearRect(0, 0, canvasEl.width, canvasEl.height);
};

const exportMask = () => {
  const canvasEl = canvas.value;
  if (!canvasEl) return;

  const dataUrl = canvasEl.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'mask.png';
  link.click();
};

// Update the purple circle cursor based on brush size
const updateCursor = (event: MouseEvent) => {
  if (!cursor.value) return;

  const pos = getMousePos(event);
  const offsetX = pos.x;
  const offsetY = pos.y;

  cursor.value.style.width = `${brushSize.value}px`;
  cursor.value.style.height = `${brushSize.value}px`;
  cursor.value.style.left = `${offsetX - brushSize.value / 2}px`;
  cursor.value.style.top = `${offsetY - brushSize.value / 2}px`;
};

onMounted(() => {
  const img = image.value;
  if (img?.complete) {
    onImageLoad();
  }
});
</script>

<template>
  <div class="image-mask">
    <div ref="container" class="image-container">
      <!-- The background image over which the user will draw -->
      <img
        ref="image"
        :src="imageSrc"
        class="background-image"
        @load="onImageLoad"
      />
      <!-- Canvas for drawing the mask -->
      <canvas ref="canvas" class="drawing-canvas" />
      <!-- Purple circle cursor -->
      <div ref="cursor" class="purple-cursor"></div>
    </div>
    <div class="controls">
      <label for="brush-size">Brush Size:</label>
      <input
        id="brush-size"
        v-model="brushSize"
        type="range"
        min="5"
        max="50"
      />
    </div>
    <button @click="clearCanvas">Clear Mask</button>
    <button @click="exportMask">Export Mask</button>
  </div>
</template>

<style scoped>
.image-container {
  position: relative;
  display: inline-block;
}

.background-image {
  display: block;
  width: 100%;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: none; /* Hide default cursor */
}

.purple-cursor {
  position: absolute;
  pointer-events: none; /* Make sure the cursor doesn't interfere with drawing */
  border-radius: 50%;
  background-color: rgba(165, 0, 165, 1); /* Semi-transparent vibrant purple */
  transform: translate(0%, 0%);
}

.controls {
  margin-top: 10px;
}

#brush-size {
  margin-left: 10px;
}
</style>
