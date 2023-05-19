<script setup lang="ts">

import {onMounted, ref} from "vue";
import {CharacterBase, getCharacters} from "@/api/characters.ts";

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
  <div v-else v-for="(character, i) of characters" :key="i">
    <router-link :to="`/characters/${character.id}`" class="px-2 text-md">
      {{  character.name }}
    </router-link>
  </div>
</template>

<style scoped>

</style>
