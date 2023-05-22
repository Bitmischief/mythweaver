<script setup lang="ts">
import { onMounted, ref } from "vue";
import { CharacterBase, getCharacters } from "@/api/characters.ts";

const characters = ref<CharacterBase[]>([]);

onMounted(async () => {
  await loadCharacters();
});

async function loadCharacters() {
  const getCharactersResponse = await getCharacters();
  characters.value = getCharactersResponse.data.data;
}
</script>

<template>
  <div v-if="characters.length === 0">
    <div class="text-2xl">No characters found!</div>
  </div>
  <div v-for="(character, i) of characters" v-else :key="i">
    <router-link :to="`/characters/${character.id}`" class="text-md px-2">
      {{ character.name }}
    </router-link>
  </div>
</template>

<style scoped></style>
