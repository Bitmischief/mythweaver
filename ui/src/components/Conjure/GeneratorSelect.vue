<script setup lang="ts">
import { Conjurer, getConjurers } from '@/api/generators.ts';
import { toTitleCase } from '@/lib/util.ts';
import { BillingPlan } from '@/api/users.ts';
import { computed, onMounted, ref } from 'vue';
import { useCurrentUserPlan } from '@/lib/hooks.ts';
import { ArrowRightIcon, LockClosedIcon } from '@heroicons/vue/24/solid';
import { useEventBus } from '@/lib/events.ts';

const props = defineProps<{
  modelValue: Conjurer | undefined;
}>();

const emit = defineEmits([
  'update:modelValue',
  'next',
  'back',
  'show-subscription-modal',
]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const eventBus = useEventBus();
const currentUserPlan = useCurrentUserPlan();
const generators = ref<Conjurer[]>([]);
const imagePresetStyles = ref<any[]>([]);

onMounted(async () => {
  await loadGenerators();
});

async function loadGenerators() {
  const generatorsResponse = await getConjurers();
  generators.value = generatorsResponse.data.data;
  value.value = generatorsResponse.data.data[0];
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
  <div class="text-xl mb-2">
    What would you like to <span class="gradient-text">Conjure</span>?
  </div>
  <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mb-6">
    <div
      v-for="(gens, i) in generators"
      :key="`generator_${i}`"
      class="cursor-pointer group/generator rounded-[20px] p-px"
      :class="{
        'active bg-gradient': value?.code === gens.code,
        'relative proOnly': proOnly(gens),
        'relative group/experimental': !proOnly(gens) && gens.experimental,
      }"
      @click="
        !proOnly(gens)
          ? (value = gens)
          : eventBus.$emit('show-subscription-modal')
      "
    >
      <div
        class="absolute h-full w-full hidden group-[.proOnly]/generator:flex justify-center rounded-[24px] bg-purple-900/10"
      >
        <div class="rounded-[20px] bg-surface-2/50 p-2 my-auto">
          <LockClosedIcon class="h-10 w-10 mx-auto" />
          <div class="">Pro Only</div>
        </div>
      </div>
      <div class="flex bg-surface-2 rounded-[24px] p-2">
        <div class="basis-1/3 self-center">
          <img
            :src="`./images/generators/${gens.imageUri}`"
            alt="generator image"
            class="rounded-[20px]"
          />
        </div>
        <div class="basis-2/3 px-3 rounded-[12px]">
          <div class="truncate text-xl flex">
            {{ gens.name }}
            <div
              v-if="gens.proOnly"
              class="self-center mx-2 text-white text-xs px-2 skew-x-[-20deg] rounded-tl-[5px] rounded-br-[5px] bg-gradient-to-r from-[#E95252] to-[#E5AD59]"
            >
              PRO
            </div>
          </div>
          <div class="text-sm text-neutral-500">
            {{ gens.description }}
          </div>
        </div>
      </div>
      <div
        class="max-h-0 group-[.active]/generator:max-h-10 transition-all overflow-hidden"
      >
        <button
          v-if="value?.code === gens.code"
          class="button-gradient flex justify-center gap-2 rounded-[16px] w-full"
          @click="
            !proOnly(gens)
              ? $emit('next')
              : eventBus.$emit('show-subscription-modal')
          "
        >
          Continue
          <ArrowRightIcon class="h-4 w-4 self-center" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
