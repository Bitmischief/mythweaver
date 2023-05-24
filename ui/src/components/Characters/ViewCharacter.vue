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

      <div class="text-md mt-2 text-white">Tags</div>
      <div class="flex w-auto flex-wrap">
        <div
          v-for="tag in character.tags"
          :key="tag"
          class="relative mb-2 mr-2 rounded-lg bg-slate-700 p-1"
        >
          {{ tag }}

          <button
            class="absolute left-0 top-0 flex h-full w-full justify-center bg-slate-800/75 opacity-0 hover:opacity-100"
            @click="removeTag(tag)"
          >
            <XMarkIcon class="h-4 w-4 self-center" />
          </button>
        </div>

        <button
          v-if="!creatingTag"
          class="mb-2 flex h-8 w-8 justify-center self-center rounded-full bg-slate-700"
          @click="startCreatingTag"
        >
          <PlusIcon class="h-4 w-4 self-center" />
        </button>
        <input
          v-else
          ref="tagQueryInput"
          v-model="tagQuery"
          class="mb-2 flex w-16 rounded-lg bg-slate-700 px-2"
          @keyup.enter="addTag"
          @blur="stopCreatingTag"
        />
      </div>

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
        alt="Character image"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/solid";
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
const creatingTag = ref(false);
const tagQuery = ref("");

const tagQueryInput = ref<HTMLElement | null>(null);

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

function startCreatingTag() {
  creatingTag.value = true;
  setTimeout(() => {
    (tagQueryInput.value as HTMLElement)?.focus();
  }, 0);
}

function stopCreatingTag() {
  creatingTag.value = false;
  tagQuery.value = "";
}

function addTag() {
  if (character.value.tags?.some((t) => t === tagQuery.value)) {
    showError({ message: "Tag already exists" });
    return;
  }

  character.value.tags?.push(tagQuery.value);
  tagQuery.value = "";
}

function removeTag(tag: string) {
  character.value.tags = character.value.tags?.filter(
    (t): t is string => t !== tag
  );
}
</script>
