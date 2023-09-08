<script lang="ts" setup>
import { PlusIcon, XCircleIcon } from '@heroicons/vue/20/solid';
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array<string>,
    required: true,
  },
  existingTags: {
    type: Array<string>,
    required: false,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const value = ref<string[]>(props.modelValue || []);

watch(value, () => {
  emit('update:modelValue', value.value);
});

const tagInput = ref('');

function addVal() {
  const index = value.value.indexOf(tagInput.value);
  if (index === -1) {
    value.value.push(tagInput.value);
  }

  tagInput.value = '';
}

function removeVal(val: string) {
  const index = value.value.indexOf(val);
  if (index > -1) {
    value.value.splice(index, 1);
  }
}
</script>

<template>
  <div>
    <ul class="flex">
      <li
        v-for="val in value"
        :key="val"
        class="mr-1 flex justify-between rounded bg-gray-600/50 p-1 px-2"
      >
        {{ val }}

        <button @click="removeVal(val)">
          <XCircleIcon class="ml-2 h-5 w-5 self-center text-white" />
        </button>
      </li>
    </ul>

    <div class="relative mt-2 h-12 w-full">
      <input
        v-model="tagInput"
        class="gradient-border-no-opacity relative h-full w-full rounded-xl border bg-black px-4 text-left text-white"
        placeholder="cyberpunk"
        @keyup.enter="addVal"
      />

      <button
        v-if="tagInput.length"
        class="absolute right-4 top-1/2 flex max-w-[25%] -translate-y-1/2 overflow-y-clip rounded bg-purple-500 p-0.5 px-2"
        @click="addVal"
      >
        <PlusIcon class="mr-1 h-4 w-4 self-center text-white" @click="addVal" />
        <span class="max-h-8 self-center overflow-y-clip"
          >Add {{ tagInput }}</span
        >
      </button>
    </div>
  </div>
</template>
