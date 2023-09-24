<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/20/solid';
import { ref } from 'vue';

const props = defineProps<{
  title: string;
  defaultOpen?: boolean;
}>();

const open = ref(props.defaultOpen || false);
</script>

<template>
  <div>
    <div class="flex mb-4 cursor-pointer" @click="open = !open">
      <ChevronDownIcon
        class="w-6 h-6 text-neutral-400 mr-2 transition-all duration-300 ease-in-out self-center"
        :class="{ 'transform rotate-180': open }"
      />
      <div class="text-white text-lg font-semibold self-center">
        {{ title }}
      </div>
    </div>
    <div class="overflow-hidden">
      <div
        class="md:w-[1125px] text-neutral-200 text-[15px] font-normal leading-7 overflow-hidden transition-all duration-200 ease-in-out"
        :class="{ 'mt-0': open, 'mt-[-1000%] md:mt-[-100%]': !open }"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>
