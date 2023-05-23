<template>
  <div class="my-8 flex justify-between">
    <router-link
      :to="`/characters`"
      class="flex rounded-xl border-2 border-gray-600/50 bg-surface-2 p-3"
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

  <div class="grid grid-cols-3 gap-8">
    <div v-if="character">
      <div class="flex justify-between">
        <div class="text-lg font-bold text-white">Info</div>
        <button
          class="rounded-lg bg-amber-200 p-1.5 text-amber-900"
          @click="regenerate"
        >
          <ArrowPathIcon
            class="h-6 w-6"
            :class="{ 'animate-spin': isBaseGenLoading }"
          />
        </button>
      </div>
      <div class="text-md mt-2 text-white">Name</div>
      <input v-model="character.name" class="text-black" />
      <div class="text-md mt-2 text-white">Looks</div>
      <textarea v-model="character.looks" class="h-[8rem] w-full text-black" />
      <div class="text-md mt-2 text-white">Personality</div>
      <textarea
        v-model="character.personality"
        class="h-[12rem] w-full text-black"
      />
      <div class="text-md mt-2 text-white">Background</div>
      <textarea
        v-model="character.background"
        class="h-[12rem] w-full text-black"
      />
    </div>

    <div>
      <div class="flex justify-between">
        <div class="text-lg font-bold text-white">Extras</div>
        <button
          class="rounded-lg bg-amber-200 p-1.5 text-amber-900"
          :disabled="!character"
          @click="clickGenerateImage"
        >
          <ArrowPathIcon
            class="h-6 w-6"
            :class="{ 'animate-spin': isImageGenLoading }"
          />
        </button>
      </div>
      <div class="text-md mt-2 text-white">Image</div>
      <img
        v-if="character.imageUri"
        :src="character.imageUri"
        class="h-auto w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeftIcon, ArrowPathIcon } from "@heroicons/vue/24/solid";
import { computed, onMounted, ref } from "vue";
import {
  CharacterBase,
  deleteCharacter,
  getCharacter,
  patchCharacter,
  postCharacter,
  postGenerateCharacter,
  postGenerateCharacterImage,
} from "@/api/characters.ts";
import { useRoute, useRouter } from "vue-router";
import { showError, showSuccess } from "@/lib/notifications.ts";

const route = useRoute();
const router = useRouter();
const character = ref<CharacterBase>({} as CharacterBase);
const newCharacter = computed(() => route.params.characterId === "new");

onMounted(async () => {
  if (newCharacter.value) {
    character.value = {} as CharacterBase;
    await regenerate();
  } else {
    const response = await getCharacter(
      parseInt(route.params.characterId.toString())
    );
    character.value = response.data as CharacterBase;
  }
});

const isBaseGenLoading = ref(false);

async function regenerate() {
  isBaseGenLoading.value = true;
  character.value = {} as CharacterBase;
  const postGenerateCharacterResponse = await postGenerateCharacter();
  character.value = postGenerateCharacterResponse.data as CharacterBase;
  isBaseGenLoading.value = false;
}

const isImageGenLoading = ref(false);

async function clickGenerateImage() {
  if (character.value?.looks?.length) {
    isImageGenLoading.value = true;
    character.value.imageUri = undefined;
    const postGenerateCharacterResponse = await postGenerateCharacterImage(
      character.value.looks
    );
    character.value.imageUri = postGenerateCharacterResponse.data[0].url;
    isImageGenLoading.value = false;
  }
}

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
