<template>
  <div v-if="generators.length" class="grid grid-cols-1 gap-8 md:grid-cols-2">
    <div
      v-for="gen of generators"
      :key="gen.name"
      class="h-30 flex cursor-pointer flex-col justify-end rounded-lg bg-cover bg-center shadow-xl md:h-60 3xl:h-[30rem]"
      :style="backgroundImageInlineStyle(gen.imageUri)"
    >
      <div class="flex justify-between rounded-b-lg bg-black/50 p-4">
        <div>
          <div class="text-xl font-bold">{{ gen.name }}</div>
          <div class="text-gray-300">{{ gen.description }}</div>
        </div>
        <div class="flex">
          <!--          <button-->
          <!--            class="rounded-xl bg-purple-500 px-4"-->
          <!--            @click="quickConjure(gen.code)"-->
          <!--          >-->
          <!--            Quick Conjure-->
          <!--          </button>-->
          <button
            class="ml-4 rounded-xl bg-gray-900/75 px-4 shadow-xl"
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
import { onMounted, ref } from "vue";
import { Conjurer, getConjurers } from "@/api/generators.ts";
import { useRouter } from "vue-router";

const router = useRouter();
const generators = ref<Conjurer[]>([]);

onMounted(async () => {
  await loadGenerators();
});

const backgroundImageInlineStyle = (imageUri: string | undefined): string => {
  if (!imageUri) {
    return "";
  }

  return `background-image: url("/images/generators/${imageUri}");`;
};

async function loadGenerators() {
  const generatorsReponse = await getConjurers();
  generators.value = generatorsReponse.data.data;
}

// async function quickConjure(generatorCode: string) {
//   await postQuickConjure(generatorCode);
// }

async function navigateToConjurer(
  generatorCode: string | undefined = undefined
) {
  await router.push(`/conjurations/conjure/${generatorCode}`);
}
</script>
