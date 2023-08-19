<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      month: 8,
      day: 12,
      year: 2023,
    }),
  },
});

const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value);
  },
});
</script>

<template>
  <div
    class="gradient-border-no-opacity min-w-56 rounded-xl border bg-black p-2 text-left text-lg text-white"
  >
    <input
      v-model="value.month"
      maxlength="2"
      class="w-12 border-none bg-transparent text-center focus:border-none"
      placeholder="mm"
      type="number"
    />
    <span class="mx-2">/</span>

    <input
      v-model="value.day"
      maxlength="2"
      class="w-12 bg-transparent text-center"
      placeholder="dd"
      type="number"
    />
    <span class="mx-2">/</span>

    <input
      v-model="value.year"
      maxlength="4"
      class="w-12 bg-transparent text-center"
      placeholder="yyyy"
      type="number"
    />
  </div>
</template>
