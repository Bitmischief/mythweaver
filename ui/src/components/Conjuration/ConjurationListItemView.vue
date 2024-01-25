<script setup lang="ts">
import {
  Conjuration,
} from '@/api/conjurations.ts';
import { useRouter } from 'vue-router';

const props = defineProps<{
  conjuration: Conjuration | undefined;
  skeleton?: boolean;
}>();

const emit = defineEmits(['add-conjuration', 'remove-conjuration']);

const router = useRouter();

async function navigateToViewConjuration(conjurationId: number) {
  await router.push(`/conjurations/view/${conjurationId}`);
}

function getConjurationDescription(conjuration: Conjuration) {
  let text = ''
  if (conjuration.conjurerCode === 'characters') {
    text = conjuration.data.background
  } else if (conjuration.conjurerCode === 'locations') {
    text = conjuration.data.history
  } else if (conjuration.conjurerCode === 'monsters') {
    text = conjuration.data.description
  }
  return text
}

function conjurationType(conjuration: Conjuration) {
  if (conjuration.conjurerCode === 'monsters') {
    return 'Monster'
  } else if (conjuration.conjurerCode === 'locations') {
    return 'Location'
  } else if (conjuration.conjurerCode === 'characters') {
    return 'NPC'
  } else {
    return ''
  }
}
</script>

<template>
  <div v-if="conjuration">
    <div
      class="relative flex cursor-pointer flex-col justify-end rounded-[20px] shadow-xl bg-surface-2"
      @click="navigateToViewConjuration(conjuration.id)"
    >
      <div class="m-2">
        <img
          v-if="conjuration.imageUri"
          :src="conjuration.imageUri"
          :alt="conjuration.name"
          class="rounded-[16px]"
        />
        <div v-else class="w-full flex justify-center h-full bg-gray-900/75">
          <div
            class="self-center text-center text-[2rem] text-white animate-pulse"
          >
            Conjuring image...
          </div>
        </div>
      </div>

      <div class="absolute left-4 top-4 flex h-6 justify-center items-center rounded-full bg-white/50 group text-black text-xs font-bold px-4">
        {{ conjurationType(conjuration) }}
      </div>

      <div class="flex w-full justify-between rounded-b-lg bg-surface-2 px-3 pb-2">
        <div>
          <div class="text-md overflow-hidden">{{ conjuration.name }}</div>
          <div class="flex flex-wrap max-h-[2.5rem] text-sm text-neutral-500 overflow-hidden text-ellipsis">
            {{ getConjurationDescription(conjuration) }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="skeleton">
    <div
      class="w-full flex justify-center bg-gray-900/75 rounded-xl h-[42rem] md:h-[52rem] 3xl:h-[62rem]"
    >
      <div class="self-center text-center text-[3rem] text-white animate-pulse">
        Conjuring...
      </div>
    </div>
  </div>
</template>
