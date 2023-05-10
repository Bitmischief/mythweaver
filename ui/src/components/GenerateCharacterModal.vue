<template>
  <Modal title="Generate a Character" :show="show" @close="emit('close')">
    <div class="mt-8 flex justify-end">
      <button class="bg-amber-200 text-amber-900 rounded-lg p-1.5" @click="regenerate">
        <ArrowPathIcon class="h-6 w-6" />
      </button>
    </div>
    <div class="grid grid-cols-3">
      <div>
        <div class="text-lg font-bold text-white">Info</div>
        <div class="mt-2 text-md text-white">Name</div>
        <input v-model="character.name" />
        <div class="mt-2 text-md text-white">Race</div>
        <input v-model="character.race" />
        <div class="mt-2 text-md text-white">Alignment</div>
        <input v-model="character.alignment" />
        <div class="mt-2 text-md text-white">Class</div>
        <input v-model="character.class" />
      </div>

      <div>
        <div class="text-lg font-bold text-white">Attributes</div>
        <div class="mt-2 text-md text-white">Level</div>
        <input v-model="character.level" />
        <div class="mt-2 text-md text-white">Strength</div>
        <input v-model="character.strength" />
        <div class="mt-2 text-md text-white">Dexterity</div>
        <input v-model="character.dexterity" />
        <div class="mt-2 text-md text-white">Constitution</div>
        <input v-model="character.constitution" />
        <div class="mt-2 text-md text-white">Intelligence</div>
        <input v-model="character.intelligence" />
        <div class="mt-2 text-md text-white">Wisdom</div>
        <input v-model="character.wisdom" />
        <div class="mt-2 text-md text-white">Charisma</div>
        <input v-model="character.charisma" />
      </div>

      <div>
        <div class="text-lg font-bold text-white">Extra</div>
        <div class="mt-2 text-md text-white">Hit Points</div>
        <input v-model="character.hitPoints" />
        <div class="mt-2 text-md text-white">Armor Class</div>
        <input v-model="character.armorClass" />
        <div class="mt-2 text-md text-white">Speed</div>
        <input v-model="character.speed" />
      </div>
    </div>

    <button class="mt-12 w-full p-2 rounded-xl bg-green-300" @click="clickSaveCharacter">Save Character</button>
  </Modal>
</template>

<script setup lang="ts">
import {ArrowPathIcon} from "@heroicons/vue/24/solid";
import {defineEmits, onUpdated, ref} from "vue";
import Modal from "@/components/Modal.vue";
import {
  Character,
  postCharacter,
  postGenerateCharacter
} from "@/api/characters.ts";

const character = ref<Character>({} as Character);

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

onUpdated(async () => {
  if (props.show) {
    await regenerate();
  }
});

async function regenerate() {
  const postGenerateCharacterResponse = await postGenerateCharacter();
  character.value = postGenerateCharacterResponse.data as Character;
}

async function clickSaveCharacter() {
  const postCharacterResponse = await postCharacter(character.value);

  if (postCharacterResponse.status === 201) {
    emit('created');
    emit('close');
  }
}

const emit = defineEmits(['close', 'created']);
</script>
