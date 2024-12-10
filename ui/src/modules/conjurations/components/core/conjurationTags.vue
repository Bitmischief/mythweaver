<script setup lang="ts">
import { useCondensedView } from '@/modules/core/composables/useCondensedView';
import type { Conjuration } from '@/modules/conjurations/types';
import { mapConjurationType } from '@/lib/util.ts';
import { useConjurationTags } from '@/modules/conjurations/composables/useConjurationTags';
import { useConjurationStore } from '@/modules/conjurations/store/conjuration.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  conjuration: Conjuration;
}>();

const { tags } = useConjurationTags(props.conjuration);
const { condensed } = useCondensedView();
const { conjurationListFilters } = storeToRefs(useConjurationStore());

const handleTagClick = (tag: string) => {
  conjurationListFilters.value.tags.push(tag);
};
</script>

<template>
  <div
    class="flex overflow-y-hidden overflow-x-hidden hover:overflow-x-auto items-start min-h-[2.3em] mb-1"
    :class="{
      'max-h-[3.5em] flex-wrap': condensed,
      'max-h-[3em] flex-nowrap': !condensed,
    }"
  >
    <div class="tag whitespace-nowrap bg-white/75 text-black flex">
      <span class="self-center">
        {{ mapConjurationType(conjuration.conjurerCode) }}
      </span>
    </div>
    <div
      v-for="(tag, i) in tags"
      :key="`${i}_${conjuration.id}_tag`"
      class="tag whitespace-nowrap cursor-pointer hover:bg-purple-500/25"
      @click.prevent="handleTagClick(tag)"
    >
      {{ tag }}
    </div>
  </div>
</template>
