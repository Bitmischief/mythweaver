<template>
  <div class="h-screen p-2 bg-gray-100">
    <div class="flex justify-between mb-4">
      <div class="text-2xl">Characters</div>
      <button class="bg-green-300 rounded-xl px-2 text-md" @click="showGenerateCharacterModal = true">Generate Character</button>
    </div>
    <div v-if="characters.length === 0">
      <div class="text-2xl">No characters found!</div>
    </div>
    <div v-else v-for="(character, i) of characters" :key="i">
      {{ character.name }}
    </div>
  </div>

  <GenerateCharacterModal :show="showGenerateCharacterModal" @close="showGenerateCharacterModal = false" @created="loadCharacters" />
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {getCharacters} from "@/api/characters.ts";
import GenerateCharacterModal from "@/components/GenerateCharacterModal.vue";

const characters = ref([]);
const showGenerateCharacterModal = ref(false);

onMounted(async () => {
  await loadCharacters();
});

async function loadCharacters() {
  const getCharactersResponse = await getCharacters();
  characters.value = getCharactersResponse.data.data;
}
</script>
