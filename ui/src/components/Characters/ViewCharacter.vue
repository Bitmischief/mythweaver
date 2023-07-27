<template>
  <div class="my-8 flex justify-between">
    <router-link
      :to="`/characters`"
      class="bg-surface-2 flex rounded-xl border-2 border-gray-600/50 p-3"
    >
      <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back to list
    </router-link>

    <div>
      <button class="rounded-xl bg-green-500 p-3" @click="clickSaveCharacter">
        Save
      </button>
      <button
        v-if="!newCharacter"
        class="ml-2 rounded-xl border-2 border-red-500 p-3"
        @click="clickDeleteCharacter"
      >
        Delete
      </button>
    </div>
  </div>

  <div v-if="character">
    <div class="flex">
      <img
        v-if="character.imageUri"
        :src="character.imageUri"
        class="h-48 w-48 self-center rounded-full"
        alt="Character image"
      />

      <div class="ml-4" style="width: calc(100% - 12rem)">
        <input
          v-model="character.name"
          class="gradient-border-no-opacity relative mt-2 h-16 w-full rounded-xl border bg-black p-4 text-left text-2xl text-white"
        />

        <textarea
          v-model="character.background"
          class="gradient-border-no-opacity mt-4 h-[8rem] w-full rounded-xl border bg-black p-4 text-left text-lg text-white"
        />
      </div>
    </div>

    <div class="mt-8 border-t-2 border-gray-600/25 pt-8">
      <div class="flex">
        <div class="text-md mr-6 w-24 self-center text-right text-white">
          Looks
        </div>
        <textarea
          v-model="character.looks"
          class="gradient-border-no-opacity mt-4 h-[8rem] w-full rounded-xl border bg-black p-4 text-left text-lg text-white"
        />
      </div>
      <div class="mt-4 flex">
        <div class="text-md mr-6 w-24 self-center text-right text-white">
          Personality
        </div>
        <textarea
          v-model="character.personality"
          class="gradient-border-no-opacity mt-4 h-[12rem] h-[8rem] w-full w-full rounded-xl border bg-black p-4 text-left text-lg text-white"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon } from "@heroicons/vue/24/solid";
import { computed, onMounted, ref } from "vue";
import {
  CharacterBase,
  deleteCharacter,
  getCharacter,
  patchCharacter,
  postCharacter,
} from "@/api/characters.ts";
import { useRoute, useRouter } from "vue-router";
import { showError, showSuccess } from "@/lib/notifications.ts";
const route = useRoute();
const router = useRouter();
const character = ref<CharacterBase>({} as CharacterBase);
const newCharacter = computed(() => route.params.characterId === "new");

onMounted(async () => {
  const response = await getCharacter(
    parseInt(route.params.characterId.toString())
  );
  character.value = response.data as CharacterBase;
});

async function clickSaveCharacter() {
  if (newCharacter.value) {
    const postCharacterResponse = await postCharacter(character.value);

    if (postCharacterResponse.status === 201) {
      await router.push(`/characters/${postCharacterResponse.data.id}`);
      showSuccess({ message: "Character saved" });
    } else {
      showError({ message: "Failed to save character" });
    }
  } else {
    const putCharacterResponse = await patchCharacter(character.value);
    if (putCharacterResponse.status === 200) {
      showSuccess({ message: "Character saved" });
    } else {
      showError({ message: "Failed to save character" });
    }
  }
}

async function clickDeleteCharacter() {
  const deleteCharacterResponse = await deleteCharacter(character.value.id);

  if (deleteCharacterResponse.status === 200) {
    showSuccess({ message: "Character deleted successfully!" });
    await router.push("/characters");
  } else {
    showError({ message: "Failed to delete character. Try again soon!" });
  }
}
</script>
