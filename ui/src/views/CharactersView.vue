<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  Character,
  getCampaignCharacter,
  patchCharacters,
} from '@/api/characters.ts';
import { AxiosError } from 'axios';
import { showError, showSuccess } from '@/lib/notifications.ts';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { useEventBus } from '@/lib/events.ts';
import Loader from '@/App.vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const eventBus = useEventBus();
const route = useRoute();
const router = useRouter();
const character = ref<Character | undefined>(undefined);
const loading = ref(false);

onMounted(async () => {
  await init();

  eventBus.$on(
    'updated-conjuration-image',
    async (payload: { imageUri: string; prompt: string }) => {
      if (!character.value) return;
      character.value.imageUri = payload.imageUri;
    },
  );
});

onUnmounted(() => {
  eventBus.$off('updated-conjuration-image');
});

const characterId = computed(() =>
  parseInt(route.params.characterId?.toString()),
);

async function init() {
  loading.value = true;
  try {
    const response = await getCampaignCharacter(characterId.value);
    character.value = response.data;
  } catch (err) {
    const e = err as AxiosError;
    if (e.response?.status === 404) {
      await router.push('/characters');
    } else {
      showError({ message: 'Failed to load character' });
    }
  } finally {
    loading.value = false;
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
  <div v-if="character && !loading">
    <FormKit
      v-slot="{ disabled }"
      :actions="false"
      type="form"
      @submit="updateCharacter"
    >
      <div class="flex w-full justify-between">
        <!-- prettier-ignore -->
        <router-link
          class="button-primary flex mb-4"
          to="/characters"
        >
          <ArrowLeftIcon class="h-5 w-5 mr-2" />
          Back
        </router-link>
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
        <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
          <div class="col-span-2">
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
  <div v-else>
    <Loader />
    Loading Character...
  </div>
</template>
