<script setup lang="ts">
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { computed } from 'vue';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/vue/24/solid';
import { Conjurer } from '@/api/generators.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';

const emit = defineEmits(['update:modelValue', 'back', 'next']);
const props = defineProps<{
  modelValue: Conjuration;
  generator: Conjurer;
}>();

const conjuration = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const dataArray = computed(() => {
  if (!conjuration.value) {
    return [];
  }

  return Object.keys(conjuration.value.data).map((key) => {
    return {
      key,
      value: conjuration.value.data[key],
    };
  });
});

function normalizeKeyName(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

async function saveConjuration() {
  try {
    await patchConjuration(conjuration.value.id, {
      name: conjuration.value.name,
      data: Object.fromEntries(dataArray.value.map((x) => [x.key, x.value])),
    });
    showSuccess({ message: 'Successfully saved conjuration!' });
  } catch (e) {
    showError({
      message:
        'Something went wrong saving your conjuration. Please try again.',
    });
  }
}
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex gap-2 justify-between">
      <button class="button-primary flex gap-2" @click="emit('back')">
        <ArrowLeftIcon class="h-5 w-5 self-center" />
        <span class="self-center">Try again</span>
      </button>

      <button class="button-gradient flex gap-2" @click="emit('next')">
        <span class="self-center">Continue to Image Generation</span>
        <ArrowRightIcon class="h-5 w-5 self-center" />
      </button>
    </div>
    <div class="mb-4 text-xl">
      Refine the details of your
      <span class="gradient-text">{{ generator.name }}</span>
    </div>
    <div class="md:flex">
      <div class="w-full">
        <div class="flex gap-2 mb-8 font-bold text-center">
          <input
            v-model="conjuration.name"
            class="input-secondary text-2xl grow"
          />
          <button
            class="button-gradient whitespace-nowrap"
            @click="saveConjuration"
          >
            Save changes
          </button>
        </div>
        <div
          v-for="(data, i) in dataArray"
          :key="`data-${i}`"
          :class="{ 'mb-8': i !== dataArray.length - 1 }"
          class="bg-surface-2 rounded-[12px]"
        >
          <div class="mb-1 text-lg text-white pt-3 px-3">
            {{ normalizeKeyName(data.key) }}
          </div>
          <FormKit
            v-model="data.value"
            type="textarea"
            inner-class="border-none"
            :input-class="{
              '$reset input-primary border-none focus:ring-fuchsia-500': true,
              'dark:text-neutral-400': true,
            }"
            auto-height
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
