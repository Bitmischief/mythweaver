<script setup>
import { onMounted, ref } from "vue";

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  speed: {
    type: Number,
    default: 50,
  },
});

const outputDiv = ref(null);

onMounted(() => {
  outputDiv.value = document.querySelector("#typewriter-output");
  typeText();
});

function typeText() {
  console.log(props.content);
  const splitTxt = props.content.split("<np>");

  splitTxt.forEach(() => {
    const p = document.createElement("p");
    p.style.margin = "0 0 1rem 0";
    outputDiv.value.appendChild(p);
  });

  const allParas = outputDiv.value.querySelectorAll("p");
  let i = 0;
  let currentPara = 0;
  const timerId = setInterval(() => {
    console.log(splitTxt, currentPara, i);
    allParas[currentPara].innerHTML += splitTxt[currentPara].charAt(i);
    i++;
    if (i === splitTxt[currentPara].length) {
      currentPara++;
      i = 0;
      if (currentPara === splitTxt.length) {
        clearInterval(timerId);
      }
    }
  }, props.speed);
}
</script>

<template>
  <div id="typewriter-output" class=""></div>
</template>
