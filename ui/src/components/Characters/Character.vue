<script lang="ts" setup>
import { CharacterBase } from "@/api/characters.ts";

const props = defineProps<{
  character: CharacterBase;
  full?: boolean;
}>();
</script>

<template>
  <div
    class="relative flex min-h-[25rem] rounded-xl bg-cover bg-center"
    :style="`background-image: url(${character.imageUri})`"
  >
    <div
      class="absolute flex h-full w-full flex-col justify-end bg-gradient-to-t from-black px-4 pb-2"
    >
      <div class="w-full">
        <div class="text-2xl">
          {{ character.name }}
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="props.full"
    class="overflow-hidden rounded-b-xl bg-black/50 px-4 pb-4 text-sm text-purple-100/75"
  >
    {{ character.background || "No background provided" }}
  </div>
</template>
