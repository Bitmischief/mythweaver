<script setup lang="ts">
import { ref } from 'vue';
import { generateArbitraryProperty } from '@/lib/generation.ts';
import { showError } from '@/lib/notifications.ts';
import { Character } from '@/api/characters.ts';
import Dots from '@/components/Core/Dots.vue';

const props = defineProps<{
  type?: 'input' | 'textarea';
  value: string | undefined;
  character?: Character;
  title: string;
  propertyOverride?: string;
  placeholder: string;
  required?: boolean;
  length?: number;
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
      length: props.length,
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
      <div class="text-sm text-neutral-400 px-1 self-center">{{ title }}</div>
    </div>
    <div class="relative">
      <FormKit
        v-if="!type || type === 'textarea'"
        v-model="input"
        auto-height
        :name="title.toLowerCase()"
        :validation="required ? 'required' : ''"
        type="textarea"
        class="w-full p-2 mt-2"
        inner-class="border-none"
        input-class="$reset input-secondary border-none focus:ring-fuchsia-500 pr-[9em]"
        :placeholder="placeholder"
      />
      <FormKit
        v-else
        v-model="input"
        :name="title.toLowerCase()"
        type="text"
        :validation="required ? 'required' : ''"
        inner-class="border-surface-3 bg-surface-2 rounded-[0.75rem]"
        :placeholder="placeholder"
      />
      <button
        class="button-gradient absolute top-0 right-0 py-2 m-px rounded-[7px]"
        type="button"
        @click="generate(propertyOverride || title.toLowerCase())"
      >
        <div v-if="!isPropertyGenerating" class="flex">
          <img src="@/assets/icons/wand.svg" alt="wand" class="h-5 mr-1" />
          <div>Generate</div>
        </div>
        <div v-else class="h-5 w-5 flex justify-center">
          <Dots class="my-1" style="font-size: 2px" />
        </div>
      </button>
    </div>
  </div>
</template>
