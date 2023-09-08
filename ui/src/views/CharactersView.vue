<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { Character, getCurrentCampaignCharacter } from '@/api/characters.ts';
import { AxiosError } from 'axios';
import { showError } from '@/lib/notifications.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';

const character = ref<Character | undefined>(undefined);
const createNewCharacter = ref(false);

onMounted(async () => {
  try {
    const response = await getCurrentCampaignCharacter();
    character.value = response.data;
  } catch (err) {
    const e = err as AxiosError;
    if (e.response?.status === 404) {
      createNewCharacter.value = true;
    } else {
      showError({ message: 'Failed to load character' });
    }
  }
});
</script>

<template>
  <div class="p-4">
    <div class="text-xl">Character</div>

    <div v-if="character">
      {{ character.name }}
    </div>
  </div>

  <ModalAlternate :show="createNewCharacter">
    <div class="md:w-[800px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="text-3xl">HELLO</div>
    </div>
  </ModalAlternate>
</template>
