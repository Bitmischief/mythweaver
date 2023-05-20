<template>
  <div class="my-8">
    <router-link :to="`/characters`" class="flex bg-surface-2 rounded-xl border-2 border-gray-600/20 p-3">
      <ArrowLeftIcon class="w-4 h-4 mr-2 self-center" /> Back to list
    </router-link>
  </div>

  <div class="grid gap-8 grid-cols-3">
    <div v-if="character">
      <div class="flex justify-between">
        <div class="text-lg font-bold text-white">Info</div>
        <button class="bg-amber-200 text-amber-900 rounded-lg p-1.5" @click="regenerate">
          <ArrowPathIcon class="h-6 w-6" :class="{ 'animate-spin': isBaseGenLoading }" />
        </button>
      </div>
      <div class="mt-2 text-md text-white">Name</div>
      <input class="text-black" v-model="character.name" />
      <div class="mt-2 text-md text-white">Looks</div>
      <textarea v-model="character.looks" class="w-full h-[8rem] text-black" />
      <div class="mt-2 text-md text-white">Personality</div>
      <textarea v-model="character.personality" class="w-full h-[12rem] text-black" />
      <div class="mt-2 text-md text-white">Background</div>
      <textarea v-model="character.background" class="w-full h-[12rem] text-black" />
    </div>

    <div>
      <div class="flex justify-between">
        <div class="text-lg font-bold text-white">Extras</div>
        <button class="bg-amber-200 text-amber-900 rounded-lg p-1.5" :disabled="!character" @click="clickGenerateImage">
          <ArrowPathIcon class="h-6 w-6" :class="{ 'animate-spin': isImageGenLoading }" />
        </button>
      </div>
      <div class="mt-2 text-md text-white">Image</div>
      <img v-if="character.imageUri" :src="character.imageUri" class="w-full h-auto" />
    </div>
  </div>

  <button class="mt-12 w-full p-2 rounded-xl bg-green-300" @click="clickSaveCharacter">Save Character</button>
</template>

<script setup lang="ts">
import {ArrowLeftIcon, ArrowPathIcon} from "@heroicons/vue/24/solid";
import {computed, onMounted, ref} from "vue";
import {
  CharacterBase, getCharacter, patchCharacter,
  postCharacter,
  postGenerateCharacter,
  postGenerateCharacterImage,
} from "@/api/characters.ts";
import {useRoute, useRouter} from "vue-router";
import {showError, showSuccess} from "@/lib/notifications.ts";

const route = useRoute();
const router = useRouter();
const character = ref<CharacterBase>({} as CharacterBase);
const newCharacter = computed(() => route.params.characterId === 'new');

onMounted(async () => {
  if (newCharacter.value) {
    await regenerate();
  } else {
    const response = await getCharacter(parseInt(route.params.characterId.toString()));
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
    const postGenerateCharacterResponse = await postGenerateCharacterImage(character.value.looks);
    character.value.imageUri = postGenerateCharacterResponse.data[0].url;
    isImageGenLoading.value = false;
  }
}

async function clickSaveCharacter() {
  if (newCharacter.value) {
    const postCharacterResponse = await postCharacter(character.value);

    if (postCharacterResponse.status === 201) {
      await router.push(`/characters/${postCharacterResponse.data.id}`);
      showSuccess({ message: 'Character saved' });
    } else {
      showError({ message: 'Failed to save character' });
    }
  } else {
    const putCharacterResponse = await patchCharacter(character.value);
    if (putCharacterResponse.status === 200) {
      showSuccess({ message: 'Character saved' });
    } else {
      showError({ message: 'Failed to save character' });
    }
  }
}
</script>
