<template>
  <div v-if="generators.length" class="grid grid-cols-1 gap-8 md:grid-cols-2">
    <div
      v-for="gen of generators"
      :key="gen.name"
      class="flex h-60 cursor-pointer flex-col justify-end rounded-lg bg-cover bg-center shadow-xl md:h-[20rem] 3xl:h-[30rem]"
      :style="backgroundImageInlineStyle(gen.imageUri)"
    >
      <div class="rounded-b-lg bg-black/50 p-4">
        <div>
          <div class="text-xl font-bold">{{ gen.name }}</div>
          <div class="text-gray-300">{{ gen.description }}</div>
        </div>
        <div class="mt-2 flex justify-between">
          <button
            class="rounded-lg bg-purple-500 px-4 py-3 shadow-xl"
            @click="quickConjure(gen.code)"
          >
            Quick Conjure
          </button>
          <button
            class="rounded-lg bg-gray-900/75 px-4 py-3 shadow-xl"
            @click="navigateToConjurer(gen.code)"
          >
            Customize
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Conjurer, getConjurers } from '@/api/generators.ts';
import { useRouter } from 'vue-router';
import { useQuickConjure } from '@/lib/hooks.ts';

const router = useRouter();
const quickConjure = useQuickConjure();
const generators = ref<Conjurer[]>([]);

onMounted(async () => {
  await loadGenerators();
});

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return '';
  }

  return `background-image: url("/images/generators/${imageUri}");`;
};

async function loadGenerators() {
  const generatorsReponse = await getConjurers();
  generators.value = generatorsReponse.data.data;
}

async function navigateToConjurer(
  generatorCode: string | undefined = undefined,
) {
  await router.push(`/conjurations/conjure/${generatorCode}`);
}
</script>
