<script setup lang="ts">
import { onMounted, ref } from "vue";
import { CharacterBase, getCharacters } from "@/api/characters.ts";
import { debounce } from "lodash";
import Character from "@/components/Characters/Character.vue";
import { useEventBus } from "@/lib/events.ts";

const eventBus = useEventBus();

const charactersSearch = ref({
  term: "",
  offset: 0,
  limit: 25,
});
const characters = ref<CharacterBase[]>([]);
const loadMore = ref(false);
const lastFilterTerm = ref("");

onMounted(async () => {
  await init();

  eventBus.$on("campaign-selected", async () => {
    await init();
  });
});

async function init() {
  characters.value = [];
  await loadCharacters();
}

async function loadCharacters() {
  const getCharactersResponse = await getCharacters({
    ...charactersSearch.value,
  });

  if (charactersSearch.value.term !== lastFilterTerm.value) {
    characters.value = getCharactersResponse.data.data;
  } else {
    characters.value.push(...getCharactersResponse.data.data);
  }

  loadMore.value =
    getCharactersResponse.data.data.length === getCharactersResponse.data.limit;
}

const searchCharacters = debounce(async () => {
  charactersSearch.value.offset = 0;
  await loadCharacters();
  lastFilterTerm.value = charactersSearch.value.term;
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

    <router-link to="/summoning">
      <button
        class="mt-8 flex cursor-pointer rounded-xl bg-black bg-gradient px-4 py-2 text-lg font-bold text-white"
      >
        <span class="self-center"> Summon New Character </span>
      </button>
    </router-link>
  </div>
  <div v-else>
    <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
      <router-link
        v-for="(character, i) of characters"
        :key="i"
        :to="`/characters/${character.id}`"
      >
        <Character :character="character" :full="false" />
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
