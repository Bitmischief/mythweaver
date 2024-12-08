<script setup lang="ts">
import { Conjuration } from '@/modules/conjurations/types';
import { useConjurationPrimaryImage } from '@/modules/conjurations/composables/useConjurationPrimaryImage';

const props = defineProps<{
  conjuration: Conjuration;
}>();

const { primaryImage } = useConjurationPrimaryImage(props.conjuration);
</script>

<template>
  <img
    v-if="primaryImage.uri"
    :src="primaryImage.uri"
    :alt="conjuration.name"
    class="rounded-[16px] aspect-square pointer-events-none w-full h-full object-cover object-center"
    :class="{ 'blur-sm': !primaryImage.id }"
  />
  <div
    v-else-if="primaryImage.failed"
    class="w-full flex aspect-square justify-center h-full bg-gray-900/75 rounded-[16px]"
  >
    <div class="self-center text-center">Image Conjuration Timed Out</div>
  </div>
  <div
    v-else-if="primaryImage.generating"
    class="w-full flex aspect-square justify-center h-full bg-gray-900/75 rounded-[16px]"
  >
    <div class="self-center text-center p-2 gradient-text animate-pulse">
      Conjuring image
    </div>
  </div>
</template>
