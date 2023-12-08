<script setup lang="ts">
import LightboxImage from '@/components/LightboxImage.vue';
import { ArrowsPointingOutIcon } from '@heroicons/vue/20/solid';
import { useEventBus } from '@/lib/events.ts';
import { onMounted } from 'vue';

const props = defineProps<{
  imageUri: string | undefined;
  prompt?: string;
  editable?: boolean;
  alt?: string;
}>();

const emit = defineEmits(['set-image']);

const eventBus = useEventBus();

onMounted(() => {
  eventBus.$on(
    'updated-conjuration-image',
    (payload: { imageUri: string; prompt: string }) => {
      console.log('updated-conjuration-image', payload);
      emit('set-image', payload);
    },
  );
});

function showCustomizeImageModal() {
  eventBus.$emit('toggle-customize-image-modal', {
    prompt: props.prompt,
    imageUri: props.imageUri,
    alt: props.alt,
  });
}

function showImage() {
  eventBus.$emit('open-lightbox', props.imageUri);
}
</script>

<template>
  <div class="relative">
    <div v-if="editable && imageUri" class="absolute flex top-2 right-2">
      <button
        class="bg-neutral-800 border border-neutral-600 px-2 md:px-4 rounded-md flex transition-all h-8 md:h-12 hover:scale-110"
        @click="showCustomizeImageModal"
      >
        <span class="self-center">Customize</span>
      </button>
    </div>

    <div
      v-if="editable && imageUri"
      class="absolute flex bottom-2 right-2 cursor-pointer"
      @click="showImage"
    >
      <ArrowsPointingOutIcon
        class="w-8 h-8 self-center transition-all hover:scale-125"
      />
    </div>

    <LightboxImage
      v-if="imageUri"
      :src="imageUri"
      :alt="alt"
      class="rounded-md"
    />
    <div
      v-else
      class="w-full min-h-[20rem] flex justify-center h-full bg-surface"
    >
      <div class="self-center text-center text-[2rem] text-white animate-pulse">
        Conjuring image...
      </div>
    </div>
  </div>
</template>
