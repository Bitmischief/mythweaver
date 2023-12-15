<script lang="ts" setup>
import { computed, ref } from 'vue';
import { ArrowPathIcon } from '@heroicons/vue/20/solid';
import { generateArbitraryProperty } from '@/lib/generation.ts';
import { showError } from '@/lib/notifications.ts';
import Suggestion from '@/components/Core/Suggestions/Suggestion.vue';

const props = defineProps<{
  modelValue: string | undefined;
  label: string;
  context?: string;
  background?: any;
  help?: string;
  type?: string;
  autoHeight?: boolean;
  disabled?: boolean;
  inputClass?: string;
  outerClass?: string;
  hideLabel?: boolean;
  disableGeneration?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const isPropertyGenerating = ref(false);
const suggestion = ref('');

async function generate() {
  if (isPropertyGenerating.value || !props.context) return;

  isPropertyGenerating.value = true;

  try {
    const val = await generateArbitraryProperty({
      propertyName: props.label,
      context: props.context,
      background: props.background,
    });

    suggestion.value = val;
  } catch (err) {
    showError({ message: `Error generating ${props.label}` });
  } finally {
    isPropertyGenerating.value = false;
  }
}
</script>

<template>
  <div class="flex w-full">
    <FormKit
      v-model="value"
      :auto-height="autoHeight"
      :label="hideLabel ? undefined : label"
      :help="help"
      :type="type"
      :input-class="inputClass"
      :outer-class="`${outerClass} ${
        disabled ? 'w-full' : 'w-[calc(100%-2rem)]'
      }`"
      :disabled="disabled"
    />

    <ArrowPathIcon
      v-if="!disableGeneration && !disabled"
      class="h-8 w-8 text-gray-400 cursor-pointer self-center ml-2"
      :class="{ 'animate-spin': isPropertyGenerating }"
      @click="generate"
    />
  </div>

  <Suggestion
    v-if="suggestion && !disabled"
    class="my-2"
    :suggestion="suggestion"
    @accept="
      value = suggestion;
      suggestion = '';
    "
    @reject="suggestion = ''"
  />
</template>
