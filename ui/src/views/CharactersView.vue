<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import {
  Character,
  getCurrentCampaignCharacter,
  patchCharacters,
} from '@/api/characters.ts';
import { AxiosError } from 'axios';
import { showError, showSuccess } from '@/lib/notifications.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';
import NewCharacter from '@/components/Characters/NewCharacter.vue';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { useEventBus } from '@/lib/events.ts';
import { UserIcon, PlusIcon } from '@heroicons/vue/24/outline';
import { XCircleIcon } from '@heroicons/vue/20/solid';

const eventBus = useEventBus();

const character = ref<Character | undefined>(undefined);
const createNewCharacter = ref(false);
const showCharacterCreate = ref(false);
const confirmClose = ref(false);
const loading = ref(false);

onMounted(async () => {
  await init();

  eventBus.$on(
    'updated-conjuration-image',
    async (payload: { imageUri: string; prompt: string }) => {
      console.log('updated-conjuration-image', payload, character.value);
      if (!character.value) return;

      character.value.imageUri = payload.imageUri;
    },
  );
});

onUnmounted(() => {
  eventBus.$off('updated-conjuration-image');
});

async function init() {
  loading.value = true;
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
  } finally {
    loading.value = false;
  }
}

function reload() {
  location.reload();
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
  <div v-if="character && !loading">
    <FormKit
      v-slot="{ disabled }"
      :actions="false"
      type="form"
      @submit="updateCharacter"
    >
      <div class="flex justify-end">
        <div>
          <!-- prettier-ignore -->
          <FormKit
            label="Save"
            type="submit"
            input-class="$reset button-ghost"
            :disabled="(disabled as boolean)"
            @click="updateCharacter"
          />
        </div>
      </div>
      <div class="md:flex justify-between">
        <div class="grid grid-cols-1 sm:grid-cols-3">
          <div class="col-span-1">
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
            <CustomizableImage
              :image-uri="character.imageUri"
              :editable="true"
              :alt="character.name"
              type="Character"
            />
            <div class="mt-4">
              <FormKit
                v-model="character.name"
                type="text"
                name="name"
                class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
                placeholder="Enter your character's name"
                validation="required|length:0,100"
              />
            </div>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <FormKit
                  v-model="character.age"
                  type="number"
                  number="integer"
                  label="Age"
                  label-class="px-2 pt-2"
                  wrapper-class="$reset w-full bg-surface border border-surface-3 rounded-[10px]"
                  :inner-class="{
                    'border-none': true,
                    'px-3': false,
                    'px-2': true,
                  }"
                  placeholder="Age"
                  validation="required|number|between:0,9999999"
                >
                  <template #suffix> years </template>
                </FormKit>
              </div>
              <div>
                <FormKit
                  v-model="character.race"
                  type="text"
                  label="Race"
                  label-class="px-2 pt-2"
                  wrapper-class="$reset w-full bg-surface border border-surface-3 rounded-[10px]"
                  :inner-class="{
                    'border-none': true,
                    'px-3': false,
                    'px-2': true,
                  }"
                  placeholder="Race"
                  validation="required|length:0,100"
                />
              </div>
              <div>
                <FormKit
                  v-model="character.class"
                  type="text"
                  label="Class"
                  label-class="px-2 pt-2"
                  wrapper-class="$reset w-full bg-surface border border-surface-3 rounded-[10px]"
                  :inner-class="{
                    'border-none': true,
                    'px-3': false,
                    'px-2': true,
                  }"
                  placeholder="Class"
                  validation="required|length:0,1000"
                />
              </div>
            </div>
          </div>
          <div class="col-span-2 px-4">
            <div class="bg-surface-2 rounded-[20px]">
              <div class="mb-1 text-lg text-white pt-3 px-3">Backstory</div>
              <FormKit
                v-model="character.backstory"
                type="textarea"
                inner-class="border-none"
                input-class="$reset input-primary text-white border-none focus:ring-fuchsia-500"
                auto-height
              />
            </div>

            <div class="bg-surface-2 rounded-[20px]">
              <div class="mb-1 text-lg text-white pt-3 px-3">Personality</div>
              <FormKit
                v-model="character.personality"
                type="textarea"
                inner-class="border-none"
                input-class="$reset input-primary text-white border-none focus:ring-fuchsia-500"
                auto-height
              />
            </div>

            <div class="bg-surface-2 rounded-[20px]">
              <div class="mb-1 text-lg text-white pt-3 px-3">Looks</div>
              <FormKit
                v-model="character.looks"
                type="textarea"
                inner-class="border-none"
                input-class="$reset input-primary text-white border-none focus:ring-fuchsia-500"
                auto-height
              />
            </div>
          </div>
        </div>
      </div>
    </FormKit>
  </div>
  <div v-else class="flex justify-center h-full items-center">
    <div class="text-center">
      <div>
        <UserIcon class="h-14 text-neutral-500 mx-auto" />
      </div>
      <div class="self-center text-2xl my-4">
        No characters created for this campaign yet.
      </div>
      <div class="text-neutral-500 mb-8 max-w-[40em]">
        Characters you create for the selected campaign will appear on this
        screen. Try creating your first character using the button below.
      </div>
      <button
        class="flex justify-center self-center button-gradient mx-auto"
        @click="showCharacterCreate = true"
      >
        <PlusIcon class="mr-2 h-5 w-5 self-center" />
        <span class="self-center">Add character</span>
      </button>
    </div>
  </div>

  <ModalAlternate :show="showCharacterCreate">
    <div class="p-6 pt-1 bg-surface-2 rounded-[20px] min-w-[50vw]">
      <button class="absolute top-4 right-4" @click="confirmClose = true">
        <XCircleIcon class="h-6" />
      </button>
      <NewCharacter @close="showCharacterCreate = false" @created="reload" />
    </div>
  </ModalAlternate>
  <ModalAlternate :show="confirmClose">
    <div class="p-6 pt-1 bg-surface-2 rounded-[20px] text-center">
      <div class="text-xl mt-4">Exit Character Creator?</div>
      <div class="py-2">
        <div class="font-bold text-fuchsia-500 my-4 max-w-[20em]">
          If you exit the character creator now you will lose all progress
          you've made up to this point.
        </div>
      </div>
      <div class="flex justify-around">
        <button class="button-primary" @click="confirmClose = false">
          Cancel
        </button>
        <button
          class="button-gradient"
          @click="
            confirmClose = false;
            showCharacterCreate = false;
          "
        >
          Confirm Exit
        </button>
      </div>
    </div>
  </ModalAlternate>
</template>
