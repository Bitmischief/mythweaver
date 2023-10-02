<script setup lang="ts">
import { ref } from 'vue';
import { generateArbitraryProperty } from '@/lib/generation.ts';
import { showError } from '@/lib/notifications.ts';
import { Character } from '@/api/characters.ts';

const props = defineProps<{
  type?: 'input' | 'textarea';
  value: string | undefined;
  character?: Character;
  title: string;
  propertyOverride?: string;
  placeholder: string;
  required?: boolean;
}>();

const input = ref(props.value || '');
const isPropertyGenerating = ref(false);

async function generate(propertyName: string) {
  if (isPropertyGenerating.value) return;

  isPropertyGenerating.value = true;
  try {
    const val = await generateArbitraryProperty({
      propertyName,
      context: 'character',
      background: props.character,
    });
    input.value = val;
  } catch (err) {
    showError({ message: `Error generating ${props.title}` });
  } finally {
    isPropertyGenerating.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between mb-2">
      <div class="text-xl self-center">{{ title }}</div>
      <button
        class="border border-neutral-800 text-xs py-2 px-4 rounded-xl text-neutral-400"
        type="button"
        :class="{
          ' transition-all hover:scale-110 hover:bg-fuchsia-500 hover:text-white':
            !isPropertyGenerating,
        }"
        @click="generate(propertyOverride || title.toLowerCase())"
      >
        <template v-if="!isPropertyGenerating"> Generate </template>
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
    <FormKit
      v-if="!type || type === 'textarea'"
      v-model="input"
      auto-height
      :name="title.toLowerCase()"
      :validation="required ? 'required' : ''"
      type="textarea"
      class="w-full p-2 mt-2"
      :placeholder="placeholder"
    />
    <FormKit
      v-else
      v-model="input"
      :name="title.toLowerCase()"
      type="text"
      :validation="required ? 'required' : ''"
      class="w-full p-2 mt-2"
      :placeholder="placeholder"
    />
  </div>
</template>
