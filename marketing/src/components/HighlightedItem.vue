<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const style = computed(() => {
  return `background-image: url('${props.image}')`;
});
</script>

<template>
  <div class="rounded-xl bg-black/50 p-5 shadow-xl">
    <div class="text-3xl">{{ title }}</div>
    <div class="text-xl text-gray-400">
      {{ subtitle }}
    </div>

    <div
      class="mt-4 h-[23.5rem] w-full bg-contain bg-center bg-no-repeat"
      :style="style"
    >
      <div class="h-full w-full bg-gradient-to-t from-black/80 from-60%">
        <div class="flex h-full flex-col justify-end p-8">
          <div class="self-center">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
