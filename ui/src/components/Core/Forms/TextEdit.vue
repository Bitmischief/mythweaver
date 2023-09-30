<script lang="ts" setup>
import { computed, ref } from 'vue';
import { autoGrowTextArea } from '@/lib/util.ts';

const props = defineProps<{
  modelValue: string | undefined;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const edit = ref(false);
const input = ref<HTMLInputElement | null>(null);

function enableEdit() {
  if (props.disabled) return;

  edit.value = true;

  setTimeout(function () {
    input.value?.focus();
  }, 0);
}
</script>

<template>
  <div>
    <div
      v-show="!edit"
      class="mt-2 cursor-pointer whitespace-pre-wrap text-lg text-gray-400"
      @click="enableEdit"
    >
      {{ value ? value : 'no value provided' }}
    </div>
    <textarea
      v-show="edit"
      ref="input"
      v-model="value"
      class="min-h-[10rem] w-full overflow-hidden rounded-xl border border-green-500 bg-surface p-3 text-lg shadow-lg"
      @blur="emit('update:modelValue', value)"
      @click="$event.stopPropagation()"
      @focus="autoGrowTextArea"
      @keyup="autoGrowTextArea"
    />
  </div>
</template>
