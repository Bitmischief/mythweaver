<script lang="ts" setup>
import { Character, postCharacters } from '@/api/characters.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import NewCharacterBasic from '@/components/Characters/NewCharacter/NewCharacterBasic.vue';
import NewCharacterDetailed from '@/components/Characters/NewCharacter/NewCharacterDetailed.vue';
import NewCharacterLooks from '@/components/Characters/NewCharacter/NewCharacterLooks.vue';
import NewCharacterConfirm from '@/components/Characters/NewCharacter/NewCharacterConfirm.vue';
import { useEventBus } from '@/lib/events.ts';
import { useRouter } from 'vue-router';

defineEmits(['close', 'created']);

const eventBus = useEventBus();
const router = useRouter();
const character = ref<Character>({} as Character);
const step = ref(1);
const conjureImageDone = ref(false);

onMounted(() => {
  eventBus.$on('conjure-image-done', () => {
    conjureImageDone.value = true;
  });

  eventBus.$on(
    'updated-conjuration-image',
    async (payload: { imageUri: string; prompt: string }) => {
      setTimeout(() => {
        character.value.imageUri = payload.imageUri;
        step.value++;
      }, 50);
    },
  );
});

onUnmounted(() => {
  eventBus.$off('conjure-image-done');
  eventBus.$off('updated-conjuration-image');
});

async function createCharacter() {
  const response = await postCharacters(character.value);
  if (response.status === 201) {
    showSuccess({ message: 'Character created' });
    await router.push(`/character/${response.data.id}`);
  } else {
    showError({
      message: 'Failed to create character. Please try again in a moment.',
    });
  }
}

async function returnToCharacters() {
  await router.push('/characters');
}
</script>

<template>
  <div class="flex p-6 rounded-[12px] pb-1 flex-col bg-surface-2">
    <div class="text-3xl">
      Bring your character
      <span
        class="bg-clip-text font-bold text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-400"
      >
        to life
      </span>
    </div>

    <NewCharacterBasic
      v-if="step === 1"
      v-model="character"
      back-text="Return to Characters"
      show-back
      @complete="step++"
      @back="returnToCharacters"
    />

    <NewCharacterDetailed
      v-if="step === 2"
      v-model="character"
      @complete="step++"
      @back="step--"
    />

    <NewCharacterLooks
      v-if="step === 3"
      v-model="character"
      @back="step--"
      @complete="step++"
    />

    <NewCharacterConfirm
      v-if="step === 4"
      :character="character"
      @back="step--"
      @complete="createCharacter"
    />
  </div>
</template>
