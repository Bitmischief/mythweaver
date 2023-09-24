<script lang="ts" setup>
import { Character, postCharacters } from '@/api/characters.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { postGenerateArbitrary } from '@/api/generators.ts';
import NewCharacterBasic from '@/components/Characters/NewCharacter/NewCharacterBasic.vue';
import NewCharacterDetailed from '@/components/Characters/NewCharacter/NewCharacterDetailed.vue';
import NewCharacterLooks from '@/components/Characters/NewCharacter/NewCharacterLooks.vue';
import NewCharacterConfirm from '@/components/Characters/NewCharacter/NewCharacterConfirm.vue';
import { useEventBus } from '@/lib/events.ts';

const emit = defineEmits(['close', 'created']);

const eventBus = useEventBus();

const character = ref<Character>({} as Character);
const generatingProperties = ref({});
const step = ref(1);
const conjureImageDone = ref(false);
const conjureImageStarted = ref(false);

onMounted(() => {
  eventBus.$on('conjure-image-done', () => {
    conjureImageDone.value = true;
  });
});

onUnmounted(() => {
  eventBus.$off('conjure-image-done');
});

const isPropertyGenerating = function (propertyName: string) {
  return generatingProperties.value[propertyName] || false;
};

async function createCharacter() {
  const response = await postCharacters(character.value);
  if (response.status === 201) {
    showSuccess({ message: 'Character created' });
    emit('created');
  } else {
    showError({
      message: 'Failed to create character. Please try again in a moment.',
    });
  }
}

async function generateProperty(propertyName: string) {
  if (isPropertyGenerating(propertyName)) return;

  generatingProperties.value = {
    ...generatingProperties.value,
    [propertyName]: true,
  };

  const response = await postGenerateArbitrary({
    propertyName,
    context: 'character',
    background: {
      ...character.value,
      [propertyName]: undefined,
    },
  });

  if (response.status === 200) {
    character.value[propertyName] = response.data.propertyValue;
    generatingProperties.value = {
      ...generatingProperties.value,
      [propertyName]: false,
    };
  } else {
    showError({
      message: `Failed to create generate ${propertyName}. Please try again in a moment.`,
    });
  }
}

function generateImage() {
  eventBus.$emit('conjure-image', {});
  conjureImageStarted.value = true;
}
</script>

<template>
  <div
    class="flex h-full p-2 overflow-y-auto pr-6 pb-1 flex-col justify-between"
  >
    <div class="text-3xl">
      Bring your character
      <span
        class="bg-clip-text font-bold text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-400"
      >
        to life
      </span>
    </div>

    <div>
      <NewCharacterBasic
        v-if="step === 1"
        v-model="character"
        :generate-property="generateProperty"
        :is-property-generating="isPropertyGenerating"
      />

      <NewCharacterDetailed
        v-if="step === 2"
        v-model="character"
        :generate-property="generateProperty"
        :is-property-generating="isPropertyGenerating"
      />

      <NewCharacterLooks v-if="step === 3" v-model="character" />

      <NewCharacterConfirm v-if="step === 4" v-model="character" />
    </div>

    <div class="flex mt-8" :class="{ 'justify-between': step === 4 }">
      <button
        v-if="step === 1"
        class="flex self-center mr-2 rounded-md border border-neutral-700 px-4 py-3 transition-all hover:scale-110"
        @click="emit('close')"
      >
        <span class="self-center">Skip for now</span>
      </button>

      <button
        v-if="step > 1"
        class="flex self-center mr-2 rounded-md border border-neutral-700 px-4 py-3 transition-all hover:scale-110"
        @click="step--"
      >
        <span class="self-center">Back</span>
      </button>

      <button
        v-if="step < 3"
        class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="step++"
      >
        <span class="self-center">Continue</span>
      </button>

      <button
        v-if="step === 3 && !conjureImageDone && !conjureImageStarted"
        class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="generateImage"
      >
        <span class="self-center">Conjure Image</span>
      </button>

      <button
        v-if="step === 3 && conjureImageDone"
        class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="step++"
      >
        <span class="self-center">Continue</span>
      </button>

      <button
        v-if="step === 4"
        class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="createCharacter"
      >
        <span class="self-center">Save Character</span>
      </button>
    </div>
  </div>
</template>
