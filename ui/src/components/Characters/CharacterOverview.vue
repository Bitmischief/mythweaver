<template>
  <div>
    <div class="flex justify-end cursor-pointer" @click="emit('close')">
      <XCircleIcon class="h-5" />
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
            :editable="false"
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
              disabled
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
                disabled
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
                disabled
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
                disabled
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
              disabled
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
              disabled
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
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Character } from '@/api/characters';
import CustomizableImage from '../Images/CustomizableImage.vue';
import { XCircleIcon } from '@heroicons/vue/20/solid';
import { ref } from 'vue';

const emit = defineEmits(['close']);

const props = defineProps<{
  character: Character;
}>();

const character = ref<Character>(props.character);
</script>
