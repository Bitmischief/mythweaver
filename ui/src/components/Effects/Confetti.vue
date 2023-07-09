<script setup lang="ts">
import { onMounted } from "vue";
import { useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let cx, cy: number;

onMounted(() => {
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  cx = ctx.canvas.width / 2;
  cy = ctx.canvas.height / 2;

  eventBus.$on("fireConfetti", () => {
    initConfetti();
    render();
  });
});

let confetti = [];
const confettiCount = 200;
const gravity = 0.7;
const terminalVelocity = 6;
const drag = 0.075;
const colors = [
  { front: "red", back: "darkred" },
  { front: "green", back: "darkgreen" },
  { front: "blue", back: "darkblue" },
  { front: "yellow", back: "darkyellow" },
  { front: "orange", back: "darkorange" },
  { front: "pink", back: "darkpink" },
  { front: "purple", back: "darkpurple" },
  { front: "turquoise", back: "darkturquoise" },
];

//-----------Functions--------------
const resizeCanvas = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  cx = ctx.canvas.width / 2;
  cy = ctx.canvas.height / 2;
};

const randomRange = (min, max) => Math.random() * (max - min) + min;

const initConfetti = () => {
  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      color: colors[Math.floor(randomRange(0, colors.length))],
      dimensions: {
        x: randomRange(10, 20),
        y: randomRange(10, 30),
      },

      position: {
        x: randomRange(0, canvas.width),
        y: canvas.height - 1,
      },

      rotation: randomRange(0, 2 * Math.PI),
      scale: {
        x: 1,
        y: 1,
      },

      velocity: {
        x: randomRange(-25, 25),
        y: randomRange(0, -50),
      },
    });
  }
};

//---------Render-----------
const render = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  confetti.forEach((confetto, index) => {
    let width = confetto.dimensions.x * confetto.scale.x;
    let height = confetto.dimensions.y * confetto.scale.y;

    // Move canvas to position and rotate
    ctx.translate(confetto.position.x, confetto.position.y);
    ctx.rotate(confetto.rotation);

    // Apply forces to velocity
    confetto.velocity.x -= confetto.velocity.x * drag;
    confetto.velocity.y = Math.min(
      confetto.velocity.y + gravity,
      terminalVelocity
    );
    confetto.velocity.x += Math.random() > 0.5 ? Math.random() : -Math.random();

    // Set position
    confetto.position.x += confetto.velocity.x;
    confetto.position.y += confetto.velocity.y;

    // Delete confetti when out of frame
    if (confetto.position.y >= canvas.height) confetti.splice(index, 1);

    // Loop confetto x position
    if (confetto.position.x > canvas.width) confetto.position.x = 0;
    if (confetto.position.x < 0) confetto.position.x = canvas.width;

    // Spin confetto by scaling y
    confetto.scale.y = Math.cos(confetto.position.y * 0.1);
    ctx.fillStyle =
      confetto.scale.y > 0 ? confetto.color.front : confetto.color.back;

    // Draw confetti
    ctx.fillRect(-width / 2, -height / 2, width, height);

    // Reset transform matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  window.requestAnimationFrame(render);
};

//----------Resize----------
window.addEventListener("resize", function () {
  resizeCanvas();
});
</script>

<template>
  <canvas id="canvas" class="confetti"></canvas>
</template>

<style scoped>
.confetti {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  display: block;
  margin: 0 auto;
  user-select: none;
  pointer-events: none;
}
</style>
