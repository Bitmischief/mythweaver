<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import {
  Character,
  getCurrentCampaignCharacter,
  patchCharacters,
} from '@/api/characters.ts';
import { AxiosError } from 'axios';
import { showError, showSuccess } from '@/lib/notifications.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';
import NewCharacter from '@/components/Characters/NewCharacter.vue';
import { UserIcon } from '@heroicons/vue/20/solid';
import Accordion from '@/components/Core/Accordion.vue';
import TextEdit from '@/components/Core/Forms/TextEdit.vue';

const character = ref<Character | undefined>(undefined);
const createNewCharacter = ref(false);

onMounted(async () => {
  await init();
});

async function init() {
  try {
    const response = await getCurrentCampaignCharacter();
    character.value = response.data;
    createNewCharacter.value = false;
  } catch (err) {
    const e = err as AxiosError;
    if (e.response?.status === 404) {
      createNewCharacter.value = true;
    } else {
      showError({ message: 'Failed to load character' });
    }
  }
}

async function updateCharacter() {
  if (!character.value) return;

  try {
    await patchCharacters(character.value.id, character.value);
    showSuccess({ message: 'Character updated' });
  } catch (err) {
    showError({ message: 'Failed to update character' });
  }
}
</script>

<template>
  <div class="p-4">
    <div v-if="character">
      <div class="md:flex justify-between">
        <div class="md:flex">
          <div
            class="md:w-[12rem] 3xl:w-[20rem] md:h-[12rem] 3xl:h-[20rem] group relative cursor-pointer"
          >
            <div
              class="group-hover:block hidden absolute w-full h-full bg-black/50"
            >
              <div class="flex justify-center items-center h-full">
                <div
                  class="text-2xl shadow-2xl bg-clip-text font-bold text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-400"
                >
                  Conjure Image
                </div>
              </div>
            </div>
            <img
              v-if="character.imageUri"
              :src="character.imageUri"
              class="rounded-[10px]"
              :alt="character.name"
            />
            <div
              v-else
              class="bg-neutral-800 rounded-xl w-full h-full flex justify-center"
            >
              <UserIcon class="w-[80%] h-[80%] self-center opacity-10" />
            </div>
          </div>
          <div class="md:ml-6 mt-6 md:mt-0 self-center">
            <div>
              <input
                v-model="character.name"
                class="text-3xl 3xl:text-5xl bg-transparent border-0 pl-0"
              />
            </div>
            <div>
              <input
                v-model="character.age"
                class="text-lg bg-transparent border-0 py-1 px-0"
              />
            </div>
            <div>
              <input
                v-model="character.race"
                class="text-lg 3xl:text-5xl bg-transparent border-0 py-1 px-0"
              />
            </div>
            <div>
              <input
                v-model="character.class"
                class="text-lg 3xl:text-5xl bg-transparent border-0 py-1 px-0"
              />
            </div>
          </div>
        </div>

        <button
          class="h-12 rounded-md bg-green-500 px-3 py-1 transition-all hover:scale-110"
          @click="updateCharacter"
        >
          Save
        </button>
      </div>

      <Accordion
        title="Background"
        default-open
        class="mt-6 border-t border-neutral-800 pt-4"
      >
        <TextEdit v-model="character.background" />
      </Accordion>

      <Accordion
        title="Personality"
        class="mt-2 border-t border-neutral-800 pt-4"
      >
        <TextEdit v-model="character.personality" />
      </Accordion>

      <Accordion title="Looks" class="mt-2 border-t border-neutral-800 pt-4">
        <TextEdit v-model="character.looks" />
      </Accordion>
    </div>
    <div v-else>
      <div class="text-4xl">You don't have a character in this campaign</div>

      <button
        class="mt-6 flex self-center rounded-md text-lg bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="createNewCharacter = true"
      >
        <span class="self-center">Create A Character</span>
      </button>
    </div>
  </div>

  <ModalAlternate :show="createNewCharacter">
    <div
      class="md:w-[1000px] max-h-[90vh] p-6 bg-neutral-900 overflow-y-auto rounded-[20px]"
    >
      <NewCharacter @close="createNewCharacter = false" @created="init" />
    </div>
  </ModalAlternate>
</template>
