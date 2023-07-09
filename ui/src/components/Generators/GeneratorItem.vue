<script setup lang="ts">
import { computed, PropType } from "vue";

const props = defineProps({
  generator: {
    type: Object as PropType<Generator>,
    required: true,
  },
});

const backgroundImageInlineStyle = computed(() => {
  return `background-image: url("/images/generators/${props.generator.imageUri}");`;
});
</script>

<template>
  <div
    class="h-30 flex cursor-pointer flex-col justify-end rounded-lg bg-cover bg-center shadow-xl md:h-60 3xl:h-[30rem]"
    :style="backgroundImageInlineStyle"
  >
    <div class="rounded-b-lg bg-black/50 p-4">
      <div class="text-xl font-bold">{{ generator.name }}</div>
      <div class="text-gray-300">{{ generator.description }}</div>
    </div>
  </div>
</template>
