<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { Conjurer } from '@/api/generators.ts';
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { computed, onMounted } from 'vue';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { useEventBus } from '@/lib/events.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useRouter } from 'vue-router';

const emit = defineEmits(['update:modelValue', 'back', 'next']);
const props = defineProps<{
  modelValue: Conjuration;
  generator: Conjurer;
}>();
const eventBus = useEventBus();
const router = useRouter();

const conjuration = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

onMounted(() => {
  eventBus.$on('updated-conjuration-image', async (data: any) => {
    conjuration.value.imageUri = data.imageUri;
    await saveConjuration();
  });
});

async function saveConjuration() {
  try {
    await patchConjuration(conjuration.value.id, {
      imageUri: conjuration.value.imageUri || '',
    });
    showSuccess({ message: 'Successfully saved conjuration image!' });
    await viewConjuration();
  } catch (e) {
    showError({
      message:
        'Something went wrong saving your conjuration image. Please try again.',
    });
  }
}

const viewConjuration = async () => {
  await router.push(`/conjurations/view/${conjuration.value.id}`);
};
</script>

<template>
  <div class="w-full">
    <div class="mb-4 flex gap-2">
      <button class="button-primary flex gap-2" @click="emit('back')">
        <ArrowLeftIcon class="h-5 w-5 self-center" />
        <span class="self-center">Back</span>
      </button>
      <div class="text-xl self-center">
        Generate an image for your
        <span class="gradient-text">{{ generator.name }}</span>
      </div>
    </div>
    <div>
      <CustomizeConjurationImage
        :prompt="conjuration?.imageAIPrompt"
        :linking="{ conjurationId: conjuration?.id }"
      />
    </div>
  </div>
</template>

<style scoped></style>
