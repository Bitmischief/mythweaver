<script setup lang="ts">
import { useEventBus } from '@/lib/events.ts';
import { onUpdated } from 'vue';

const props = defineProps<{
  src: string;
  alt?: string;
  showLightbox?: boolean;
}>();

const eventBus = useEventBus();

onUpdated(() => {
  if (props.showLightbox) {
    eventBus.$emit('open-lightbox', props.src);
  }
});

function clickImage() {
  eventBus.$emit('open-lightbox', props.src);
}
</script>

<template>
  <img :src="src" :alt="alt" class="cursor-pointer" @click="clickImage" />
</template>
