<script setup lang="ts">
import { Conjurer } from '@/api/generators.ts';
import { Conjuration, saveConjuration } from '@/api/conjurations.ts';
import { computed, onMounted, onUnmounted } from 'vue';
import ConjureImage from '@/components/Conjure/ConjureImage.vue';
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
  channel.bind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
});

async function primaryImageSetHandler() {
  showSuccess({ message: 'Successfully saved conjuration image!' });
  await saveConjuration(conjuration.value.id);
  await viewConjuration();
}

onUnmounted(() => {
  channel.unbind(ServerEvent.PrimaryImageSet, primaryImageSetHandler);
});

const viewConjuration = async () => {
  await router.push(`/conjurations/view/${conjuration.value.id}`);
};
</script>

<template>
  <div class="relative w-full">
    <div class="gap-2">
      <div class="text-xl self-center mb-2 whitespace-nowrap">
        Generate an image of your
        <span class="gradient-text">{{ generator.name }}</span>
      </div>
    </div>
    <div>
      <ConjureImage
        :image="{ prompt: conjuration?.imageAIPrompt || '' }"
        :linking="{ conjurationId: conjuration?.id }"
        :show-image-credits="false"
        save-button-text-override="Save and Continue"
        show-back
        @back="emit('back')"
      />
    </div>
  </div>
</template>

<style scoped></style>
