<script lang="ts" setup>
import {
  Character,
  postCharacters,
  patchCharacters,
} from '@/api/characters.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import NewCharacterBasic from '@/components/Characters/NewCharacter/NewCharacterBasic.vue';
import NewCharacterDetailed from '@/components/Characters/NewCharacter/NewCharacterDetailed.vue';
import NewCharacterLooks from '@/components/Characters/NewCharacter/NewCharacterLooks.vue';
import NewCharacterConfirm from '@/components/Characters/NewCharacter/NewCharacterConfirm.vue';
import { useEventBus } from '@/lib/events.ts';
import { useRouter } from 'vue-router';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';

defineEmits(['close', 'created']);

const eventBus = useEventBus();
const router = useRouter();
const character = ref<Character>({} as Character);
const step = ref(1);
const conjureImageDone = ref(false);
const channel = useWebsocketChannel();

onMounted(async () => {
  eventBus.$on('conjure-image-done', () => {
    conjureImageDone.value = true;
  });

  channel.bind(ServerEvent.PrimaryImageSet, (data: any[]) => {
    setTimeout(() => {
      character.value.images = data;
      step.value++;
    }, 50);
  });
});

onUnmounted(() => {
  eventBus.$off('conjure-image-done');
  channel.unbind_all();
});

async function initCharacter() {
  if (!character.value.id) {
    const response = await postCharacters(character.value);
    character.value.id = response.data.id;
  } else {
    await patchCharacters(character.value.id, character.value);
  }
  step.value++;
}

async function finishCharacter() {
  const response = await patchCharacters(character.value.id, character.value);
  if (response.status === 200) {
    showSuccess({ message: 'Character saved' });
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

async function next() {
  await patchCharacters(character.value.id, character.value);
  step.value++;
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
      @complete="initCharacter"
      @back="returnToCharacters"
    />

    <NewCharacterDetailed
      v-if="step === 2"
      v-model="character"
      @complete="next"
      @back="step--"
    />

    <NewCharacterLooks
      v-if="step === 3"
      v-model="character"
      @back="step--"
      @complete="next"
    />

    <NewCharacterConfirm
      v-if="step === 4"
      :character="character"
      @back="step--"
      @complete="finishCharacter"
    />
  </div>
</template>
