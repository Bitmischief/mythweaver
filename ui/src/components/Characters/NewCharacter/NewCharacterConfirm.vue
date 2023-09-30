<script lang="ts" setup>
import { Character } from '@/api/characters.ts';
import LightboxImage from '@/components/LightboxImage.vue';

defineProps<{
  character: Character;
}>();
</script>

<template>
  <div class="mt-8 w-full overflow-x-hidden">
    <div class="flex">
      <LightboxImage
        :src="character.imageUri"
        class="w-[10rem] rounded-[10px]"
      />
      <div class="self-center ml-6 w-full grid 3xl:grid-cols-4 gap-4">
        <div>
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
      </div>
    </div>
    <div class="w-full">
      <div class="mt-6 grid md:grid-cols-2 gap-8">
        <div>
          <div class="text-md text-neutral-500">Backstory</div>
          <div class="text-lg">
            {{
              character.background?.length
                ? character.background
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
      </div>
    </div>
  </div>
</template>
