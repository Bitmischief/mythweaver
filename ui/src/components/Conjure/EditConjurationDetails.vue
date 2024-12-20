<script setup lang="ts">
import { patchConjuration, saveConjuration } from '@/modules/conjurations/api';
import { computed, ref } from 'vue';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/vue/24/solid';
import { Conjurer } from '@/api/generators.ts';
import { showError } from '@/lib/notifications.ts';
import WysiwygEditor from '@/components/Core/WysiwygEditor.vue';
import { useRouter } from 'vue-router';
import { Conjuration } from '@/modules/conjurations/types';

const router = useRouter();
const emit = defineEmits(['update:modelValue', 'back', 'next']);
const props = defineProps<{
  modelValue: Conjuration;
  generator: Conjurer;
}>();
const readOnly = ref(true);

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

async function saveConjurationData() {
  try {
    await patchConjuration(conjuration.value.id, {
      name: conjuration.value.name,
      data: Object.fromEntries(dataArray.value.map((x) => [x.key, x.value])),
    });
  } catch (e) {
    showError({
      message:
        'Something went wrong saving your conjuration. Please try again.',
    });
  }
}

const saveAndContinue = async () => {
  await saveConjurationData();
  emit('next');
};

const saveAndGotoConjuration = async () => {
  await saveConjurationData();
  await saveConjuration(conjuration.value.id);
  await router.push(`/conjurations/view/${conjuration.value.id}`);
};
</script>

<template>
  <div class="w-full">
    <div class="mb-4 text-xl">
      Refine the details of your
      <span class="gradient-text">{{ generator.name }}</span>
    </div>
    <div class="mb-4 flex gap-2 justify-between">
      <button class="button-primary flex gap-2" @click="emit('back')">
        <ArrowLeftIcon class="h-5 w-5 self-center" />
        <span class="self-center">Try again</span>
      </button>

      <div>
        <button class="button-gradient flex gap-2" @click="saveAndContinue">
          <span class="self-center">Create an Image</span>
          <ArrowRightIcon class="h-5 w-5 self-center" />
        </button>
      </div>
    </div>
    <div class="flex justify-end">
      <button
        class="button-text underline text-neutral-500 flex gap-2 py-0"
        @click="saveAndGotoConjuration"
      >
        <span class="self-center">Skip Image</span>
        <ArrowRightStartOnRectangleIcon class="h-5 w-5 self-center" />
      </button>
    </div>
    <div class="md:flex">
      <div class="w-full">
        <div class="mb-8 font-bold">
          <label>Name</label>
          <InputText v-model="conjuration.name" class="!text-lg" />
        </div>
        <div class="text-sm text-neutral-400">
          Double click anywhere in the editor to start editing the content.
        </div>
        <WysiwygEditor
          :key="'' + readOnly"
          v-model="conjuration.data"
          :read-only="readOnly"
          :placeholder="`Add details to your ${generator.name} here!`"
          :context="generator.name"
          @dblclick="readOnly = false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
