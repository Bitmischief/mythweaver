<script setup lang="ts">
import { ref } from 'vue';
import { Image } from '../types/image';
import { Pencil } from 'lucide-vue-next';
import { useEditImage } from '../composables/useEditImage';

defineProps<{
  image: Image;
  allowEdits?: boolean;
  disableSetAsPrimary?: boolean;
}>();

const { setSelectedImage } = useEditImage();

const selected = ref(false);
</script>

<template>
  <div>
    <div
      v-if="image.generating"
      class="h-[22rem] w-full bg-neutral-800 rounded-lg animate-pulse flex"
    >
      <div class="m-auto self-center text-neutral-500">conjuring...</div>
    </div>
    <img
      v-else
      :key="image.id"
      :src="image.uri"
      class="object-contain rounded-lg max-h-full"
      @click="selected = !selected"
      :class="{
        'border-2 border-green-500 rounded-b-none': selected,
        'cursor-pointer': true,
      }"
    />

    <div v-if="selected">
      <div class="flex rounded-b-md bg-neutral-800 justify-end gap-4 p-2">
        <Pencil
          v-if="allowEdits"
          class="w-5 h-5 text-neutral-400 hover:text-neutral-500 cursor-pointer self-center"
          @click="setSelectedImage(image.id)"
        />
        <button :disabled="disableSetAsPrimary" class="button-gradient">
          Set as primary image
        </button>
      </div>
    </div>
  </div>
</template>
