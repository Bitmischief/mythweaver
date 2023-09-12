<script lang="ts" setup>
import { computed } from 'vue';
import Select from '@/components/Core/Forms/Select.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      hours:
        new Date().getHours() > 12
          ? new Date().getHours() - 12
          : new Date().getHours(),
      minutes: new Date().getMinutes().toString().padStart(2, '0'),
      ampm: new Date().getHours() > 12 ? 'PM' : 'AM',
    }),
  },
});

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});
</script>

<template>
  <div
    class="gradient-border-no-opacity min-w-60 flex rounded-xl border bg-black p-2 text-left text-lg text-white"
  >
    <input
      v-model="value.hours"
      maxlength="2"
      class="w-12 bg-transparent text-xl border-none text-center"
      placeholder="hh"
      type="number"
    />

    <span class="mx-2 self-center">:</span>

    <input
      v-model.number="value.minutes"
      maxlength="2"
      class="w-12 bg-transparent text-xl border-none text-center"
      placeholder="mm"
      type="number"
    />

    <Select
      v-model="value.ampm"
      :options="[
        { key: 'AM', value: 'AM' },
        { key: 'PM', value: 'PM' },
      ]"
      display-prop="key"
      value-prop="value"
      class="ml-auto self-center w-16"
      no-icon
    />
  </div>
</template>
