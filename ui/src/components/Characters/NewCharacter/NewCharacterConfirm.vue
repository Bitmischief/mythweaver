<script lang="ts" setup>
import { Character } from '@/api/characters.ts';
import LightboxImage from '@/components/LightboxImage.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

defineProps<{
  character: Character;
}>();

const emit = defineEmits(['back', 'complete']);
</script>

<template>
  <div class="mt-8">
    <div class="mb-4 flex justify-between">
      <button class="button-ghost-primary flex" @click="emit('back')">
        <ArrowLeftIcon class="h-4 mr-1 self-center" />
        Back
      </button>
      <button class="button-gradient" @click="emit('complete')">
        Save Character
      </button>
    </div>
    <div class="md:flex mb-6">
      <div class="w-full md:w-1/3">
        <LightboxImage
          :src="character.images?.find((i) => i.primary)?.uri"
          class="rounded-[10px]"
        />
      </div>
      <div class="w-full md:w-2/3 px-6 flex flex-wrap justify-between">
        <div class="w-full mb-4">
          <div class="text-md text-neutral-500">Name</div>
          <div class="text-2xl">{{ character.name }}</div>
        </div>
        <div>
          <div class="text-md text-neutral-500">Age</div>
          <div class="text-2xl">
            {{ !!character.age ? character.age : 'Age not provided' }}
          </div>
        </div>
        <div>
          <div class="text-md text-neutral-500">Race</div>
          <div class="text-2xl">
            {{ character.race?.length ? character.race : 'Race not provided' }}
          </div>
        </div>
        <div>
          <div class="text-md text-neutral-500">Class</div>
          <div class="text-2xl">
            {{
              character.class?.length ? character.class : 'Class not provided'
            }}
          </div>
        </div>
        <div class="w-full">
          <div class="mt-6 grid grid-cols-1 gap-8">
            <div>
              <div class="text-md text-neutral-500">Backstory</div>
              <div class="text-lg">
                {{
                  character.backstory?.length
                    ? character.backstory
                    : 'Backstory not provided'
                }}
              </div>
            </div>
            <div>
              <div class="text-md text-neutral-500">Personality</div>
              <div class="text-lg">
                {{
                  character.personality?.length
                    ? character.personality
                    : 'Personality not provided'
                }}
              </div>
            </div>
            <div>
              <div class="text-md text-neutral-500">Looks</div>
              <div class="text-lg">
                {{
                  character.looks?.length
                    ? character.looks
                    : 'Looks not provided'
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
