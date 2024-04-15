<script setup lang="ts">
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { Character } from '@/api/characters.ts';
import { computed, onMounted, onUnmounted } from 'vue';
import { useEventBus } from '@/lib/events.ts';
import LightboxImage from '@/components/LightboxImage.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

const props = defineProps<{
  modelValue: Character;
}>();

const emit = defineEmits(['update:modelValue', 'complete', 'back']);

const eventBus = useEventBus();

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

onMounted(() => {
  eventBus.$on(
    'updated-conjuration-image',
    (payload: { imageUri: string; prompt: string }) => {
      setTimeout(() => {
        value.value.imageUri = payload.imageUri;
        emit('complete');
      }, 50);
    },
  );
});

onUnmounted(() => {
  eventBus.$off('updated-conjuration-image');
});
</script>

<template>
  <div class="mt-8">
    <div class="flex justify-center">
      <div v-if="value.imageUri">
        <LightboxImage
          :src="value.imageUri"
          class="w-72 rounded-md"
          :alt="value.name"
        />

        <div class="mt-8 flex">
          <button class="button-ghost-primary mb-4 flex" @click="emit('back')">
            <ArrowLeftIcon class="w-4 mr-1 self-center" />
            Back
          </button>
          <button
            class="bg-neutral-800 mr-2 mb-4 rounded-md py-2 px-4"
            @click="emit('complete')"
          >
            Save And Continue
          </button>
        </div>
      </div>
      <div v-else class="shrink">
        <CustomizeConjurationImage
          :prompt="value.looks"
          :linking="{ characterId: value.id }"
          cancel-button-text-override="Back"
          @cancel="emit('back')"
        />
      </div>
    </div>
    <div class="flex justify-between mt-8">
      <button class="button-ghost-primary mb-4 flex" @click="emit('back')">
        <ArrowLeftIcon class="w-4 mr-1 self-center" />
        Back
      </button>
    </div>
  </div>
</template>
