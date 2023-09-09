<script lang="ts" setup>
import { Character, postCharacters } from '@/api/characters.ts';
import { ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';

const emit = defineEmits(['close']);

const character = ref<Character>({} as Character);

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
</script>

<template>
  <div class="text-3xl">
    Bring your character
    <span
      class="bg-clip-text font-bold text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-400"
    >
      to life
    </span>
  </div>

  <div class="mt-8">
    <div class="flex justify-between">
      <div class="text-xl">Name</div>
      <button
        class="border border-neutral-800 text-xs py-2 px-4 rounded-xl text-neutral-400 transition-all hover:scale-110 hover:bg-fuchsia-500 hover:text-white"
      >
        Generate
      </button>
    </div>
    <input
      v-model="character.name"
      class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
      placeholder="Enter your character's name"
    />
  </div>

  <div class="mt-8">
    <div class="flex justify-between">
      <div class="text-xl">Backstory</div>
      <button
        class="border border-neutral-800 text-xs py-2 px-4 rounded-xl text-neutral-400 transition-all hover:scale-110 hover:bg-fuchsia-500 hover:text-white"
      >
        Generate
      </button>
    </div>
    <textarea
      v-model="character.background"
      class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
      placeholder="Enter your character's name"
    ></textarea>
  </div>

  <div class="mt-8">
    <div class="flex justify-between">
      <div class="text-xl">Personality</div>
      <button
        class="border border-neutral-800 text-xs py-2 px-4 rounded-xl text-neutral-400 transition-all hover:scale-110 hover:bg-fuchsia-500 hover:text-white"
      >
        Generate
      </button>
    </div>
    <textarea
      v-model="character.personality"
      class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
      placeholder="Enter your character's name"
    ></textarea>
  </div>

  <div class="mt-8">
    <div class="flex justify-between">
      <div>
        <div class="text-xl">Looks</div>
        <div class="text-xs text-neutral-500">
          The looks provided will guide the image generation process
        </div>
      </div>
      <button
        class="border border-neutral-800 text-xs h-8 self-center py-2 px-4 rounded-xl text-neutral-400 transition-all hover:scale-110 hover:bg-fuchsia-500 hover:text-white"
      >
        Generate
      </button>
    </div>
    <textarea
      v-model="character.looks"
      class="w-full p-2 mt-2 bg-neutral-800 rounded-[10px]"
      placeholder="Enter your character's name"
    ></textarea>
  </div>

  <div class="flex mt-8">
    <button
      class="flex self-center mr-2 rounded-md border border-neutral-700 px-4 py-3 transition-all hover:scale-110"
      @click="emit('close')"
    >
      <span class="self-center">Skip for now</span>
    </button>

    <button
      class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
      @click="createCharacter"
    >
      <span class="self-center">Save</span>
    </button>
  </div>
</template>
