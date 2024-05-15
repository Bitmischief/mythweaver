<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { Conjurer } from '@/api/generators.ts';
import { Conjuration, saveConjuration } from '@/api/conjurations.ts';
import { computed, onMounted, onUnmounted } from 'vue';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { showSuccess } from '@/lib/notifications.ts';
import { useRouter } from 'vue-router';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';

const emit = defineEmits(['update:modelValue', 'back', 'next']);
const props = defineProps<{
  modelValue: Conjuration;
  generator: Conjurer;
}>();
const router = useRouter();
const channel = useWebsocketChannel();

const conjuration = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

onMounted(() => {
  channel.bind(ServerEvent.PrimaryImageSet, async () => {
    showSuccess({ message: 'Successfully saved conjuration image!' });
    await saveConjuration(conjuration.value.id);
    await viewConjuration();
  });
});

onUnmounted(() => {
  channel.unbind_all();
});

const viewConjuration = async () => {
  await router.push(`/conjurations/view/${conjuration.value.id}`);
};
</script>

<template>
  <div class="w-full">
    <div class="flex flex-wrap md:flex-nowrap gap-2">
      <button class="button-primary flex gap-2" @click="emit('back')">
        <ArrowLeftIcon class="h-5 w-5 self-center" />
        <span class="self-center">Back</span>
      </button>
      <div class="text-xl self-center">
        Generate an image of your
        <span class="gradient-text">{{ generator.name }}</span>
      </div>
    </div>
    <div
      class="lg:[&>.actions]:mb-6 mt-6 [&>.actions]:mt-2 lg:[&>.actions]:-mt-[4.5em]"
    >
      <CustomizeConjurationImage
        :image="{ prompt: conjuration?.imageAIPrompt || '' }"
        :linking="{ conjurationId: conjuration?.id }"
        :show-image-credits="false"
        save-button-text-override="Save and Continue"
      />
    </div>
  </div>
</template>

<style scoped></style>
