<script setup lang="ts">
import { onMounted, ref } from "vue";
import { CharacterBase, getCharacters } from "@/api/characters.ts";
import { debounce } from "lodash";

const charactersSearch = ref({
  term: "",
  offset: 0,
  limit: 10,
});
const characters = ref<CharacterBase[]>([]);
const loadMore = ref(false);

onMounted(async () => {
  await loadCharacters();
});

async function loadCharacters() {
  const getCharactersResponse = await getCharacters({
    ...charactersSearch.value,
  });
  characters.value.push(...getCharactersResponse.data.data);
  loadMore.value =
    getCharactersResponse.data.data.length === getCharactersResponse.data.limit;
}

const searchCharacters = debounce(async () => {
  await loadCharacters();
}, 250);

async function loadMoreCharacters() {
  charactersSearch.value.offset += charactersSearch.value.limit;
  await loadCharacters();
}
</script>

<template>
  <input
    v-model="charactersSearch.term"
    class="mb-4 rounded-xl bg-slate-800 p-2 text-lg"
    placeholder="Search..."
    @keyup="searchCharacters"
  />

  <div v-if="characters.length === 0">
    <div class="text-2xl">No characters found!</div>
  </div>
  <div v-else>
    <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
      <router-link
        v-for="(character, i) of characters"
        :key="i"
        :to="`/characters/${character.id}`"
      >
        <div class="flex rounded-xl bg-purple-900 p-2">
          <div class="w-full">
            <div class="text-lg">
              {{ character.name }}
            </div>

            <div class="h-[3rem] overflow-hidden text-xs text-purple-300">
              {{ character.background || "No background provided" }}
            </div>
          </div>

          <div v-if="character.imageUri" class="ml-2 w-[4rem] self-center">
            <img
              :src="character.imageUri"
              class="w-16 self-center rounded-full"
              alt=""
            />
          </div>
        </div>
      </router-link>
    </div>

    <div v-if="loadMore" class="mt-4 flex justify-center">
      <button
        class="rounded-xl bg-slate-800 p-2 px-10 text-lg"
        @click="loadMoreCharacters"
      >
        Load more
      </button>
    </div>
  </div>
</template>

<style scoped></style>
