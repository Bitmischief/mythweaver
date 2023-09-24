<script setup lang="ts">
import { autoGrowTextArea } from '@/lib/util.ts';
import { computed } from 'vue';

const props = defineProps<{
  modelValue: any;
  type?: 'input' | 'textarea';
  title: string;
  propertyOverride?: string;
  placeholder: string;
  generateProperty: (propertyName: string) => void;
  isPropertyGenerating: (propertyName: string) => boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});
</script>

<template>
  <div>
    <div class="flex justify-between">
      <div class="text-xl">{{ title }}</div>
      <button
        class="border border-neutral-800 text-xs py-2 px-4 rounded-xl text-neutral-400"
        :class="{
          ' transition-all hover:scale-110 hover:bg-fuchsia-500 hover:text-white':
            !isPropertyGenerating(propertyOverride || title.toLowerCase()),
        }"
        @click="generateProperty(propertyOverride || title.toLowerCase())"
      >
        <template
          v-if="!isPropertyGenerating(propertyOverride || title.toLowerCase())"
        >
          Generate
        </template>
        <svg
          v-else
          class="animate-spin mx-auto h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </button>
    </div>
    <textarea
      v-if="!type || type === 'textarea'"
      v-model="value"
      class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
      :placeholder="placeholder"
      @focus="autoGrowTextArea"
    ></textarea>
    <input
      v-else
      v-model="value"
      class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
      :placeholder="placeholder"
    />
  </div>
</template>
