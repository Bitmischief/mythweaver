<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

const emit = defineEmits(['files-dropped']);

let active = ref(false);
let inActiveTimeout: any | undefined = undefined; // add a variable to hold the timeout key

function setActive() {
  active.value = true;
  clearTimeout(inActiveTimeout); // clear the timeout
}

function setInactive() {
  inActiveTimeout = setTimeout(() => {
    active.value = false;
  }, 50);
}

function onDrop(e: DragEvent) {
  setInactive(); // add this line too
  emit('files-dropped', [...(e.dataTransfer?.files || [])]);
}

function preventDefaults(e: DragEvent) {
  e.preventDefault();
}

const events = ['dragenter', 'dragover', 'dragleave', 'drop'];

onMounted(() => {
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults as EventListener);
  });
});

onUnmounted(() => {
  events.forEach((eventName) => {
    document.body.removeEventListener(
      eventName,
      preventDefaults as EventListener,
    );
  });
});
</script>

<template>
  <!-- add `data-active` and the event listeners -->
  <div
    :data-active="active"
    @dragenter.prevent="setActive"
    @dragover.prevent="setActive"
    @dragleave.prevent="setInactive"
    @drop.prevent="onDrop"
  >
    <!-- share state with the scoped slot -->
    <slot :drop-zone-active="active"></slot>
  </div>
</template>
