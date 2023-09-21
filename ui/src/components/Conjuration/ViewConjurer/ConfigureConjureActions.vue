<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { HeartIcon } from '@heroicons/vue/20/solid';
import { useEventBus } from '@/lib/events.ts';
import { saveConjuration } from '@/api/conjurations.ts';
import { useRouter } from 'vue-router';

const props = defineProps<{
  summonedItems: boolean;
  conjurationId: number | undefined;
}>();

const eventBus = useEventBus();
const router = useRouter();

async function handleSaveConjuration() {
  if (!props.conjurationId) return;

  await saveConjuration(props.conjurationId);

  eventBus.$emit('save-conjuration', {
    conjurationId: props.conjurationId,
  });

  setTimeout(async () => {
    await router.push(`/conjurations/view/${props.conjurationId}`);
  }, 250);
}
</script>

<template>
  <div class="flex justify-between mb-6">
    <router-link
      :to="`/conjurations/new`"
      class="bg-surface-2 flex rounded-md border border-gray-600/50 p-3"
    >
      <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back
    </router-link>

    <div v-if="summonedItems" class="flex">
      <button
        class="md:w-auto ml-2 flex justify-center md:justify-start self-center rounded-md bg-gradient-to-r from-green-400 to-green-600 px-4 py-3 transition-all hover:scale-110"
        @click="handleSaveConjuration"
      >
        <HeartIcon class="mr-2 h-5 w-5 self-center" />
        <span class="self-center">Save</span>
      </button>
    </div>
  </div>
</template>
