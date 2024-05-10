<script setup lang="ts">
import { Conjurer, getConjurers } from '@/api/generators.ts';
import { toTitleCase } from '@/lib/util.ts';
import { BillingPlan } from '@/api/users.ts';
import { computed, onMounted, ref } from 'vue';
import { useCurrentUserPlan } from '@/lib/hooks.ts';
import { ArrowRightIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  modelValue: Conjurer | undefined;
}>();

const emit = defineEmits(['update:modelValue', 'next', 'back']);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const currentUserPlan = useCurrentUserPlan();
const generators = ref<Conjurer[]>([]);
const imagePresetStyles = ref<any[]>([]);

onMounted(async () => {
  await loadGenerators();
});

async function loadGenerators() {
  const generatorsReponse = await getConjurers();
  generators.value = generatorsReponse.data.data;
  value.value = generatorsReponse.data.data[0];
  imagePresetStyles.value =
    value.value?.supportedImageStylePresets?.map((style) => ({
      code: style,
      name: toTitleCase(style),
    })) || [];
}

const proOnly = (gen: Conjurer) => {
  return (
    gen.proOnly &&
    currentUserPlan.value !== BillingPlan.Trial &&
    currentUserPlan.value !== BillingPlan.Pro
  );
};
</script>

<template>
  <div class="text-xl mb-2">What would you like to conjure?</div>
  <div
    class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
  >
    <div
      v-for="(gens, i) in generators"
      :key="`generator_${i}`"
      class="cursor-pointer group/generator rounded-[20px] p-px"
      :class="{
        'active bg-gradient': value === gens,
        'relative group/proOnly': proOnly(gens),
        'relative group/experimental': !proOnly(gens) && gens.experimental,
      }"
      @click="value = gens"
    >
      <div class="flex bg-surface-2 rounded-[20px] p-3">
        <div class="basis-1/4 self-center">
          <img
            :src="`./images/generators/${gens.imageUri}`"
            alt="generator image"
            class="rounded-full"
          />
        </div>
        <div class="basis-3/4 px-3 py-2 rounded-[12px] self-center">
          <div class="truncate text-xl">
            {{ gens.name }}
          </div>
          <div class="text-xs text-neutral-500 truncate-2-line">
            {{ gens.description }}
          </div>
        </div>
      </div>
      <div
        class="max-h-0 group-[.active]/generator:max-h-10 transition-all overflow-hidden"
      >
        <button
          v-if="value === gens"
          class="button-gradient flex justify-center gap-2 rounded-[16px] w-full"
          @click="$emit('next')"
        >
          Continue
          <ArrowRightIcon class="h-4 w-4 self-center" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
