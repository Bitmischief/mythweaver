<template>
  <div v-if="generators.length" class="grid grid-cols-1 gap-8 md:grid-cols-2">
    <div
      v-for="gen of generators"
      :key="gen.name"
      class="h-30 flex cursor-pointer flex-col justify-end rounded-lg bg-cover bg-center shadow-xl md:h-60 3xl:h-[30rem]"
      :style="backgroundImageInlineStyle(gen.imageUri)"
      @click="navigateToGenerator(gen.code)"
    >
      <div class="rounded-b-lg bg-black/50 p-4">
        <div class="text-xl font-bold">{{ gen.name }}</div>
        <div class="text-gray-300">{{ gen.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Summoner, getSummoners } from "@/api/generators.ts";
import { useRouter } from "vue-router";

const router = useRouter();
const generators = ref<Summoner[]>([]);

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
  const generatorsReponse = await getSummoners();
  generators.value = generatorsReponse.data.data;
}

async function navigateToGenerator(
  generatorCode: string | undefined = undefined
) {
  await router.push(`/summoning/view/${generatorCode}`);
}
</script>
