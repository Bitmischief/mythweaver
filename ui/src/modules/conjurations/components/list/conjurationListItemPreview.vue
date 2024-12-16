<script setup lang="ts">
import { Conjuration } from '@/modules/conjurations/types';
import { useConjurationUtils } from '@/modules/conjurations/composables/useConjurationUtils';
import { useCondensedView } from '@/modules/core/composables/useCondensedView';
import ConjurationPrimaryImage from '@/modules/conjurations/components/core/conjurationPrimaryImage.vue';

const props = defineProps<{
  conjuration: Conjuration;
  show: boolean;
}>();

const { condensed } = useCondensedView();
const { getConjurationDescription } = useConjurationUtils(props.conjuration);
</script>

<template>
  <div
    class="bg-surface-2 rounded-[20px] flex flex-col absolute bottom-10 right-0 left-0 opacity-0 data-[expanded=true]:opacity-100 data-[expanded=false]:top-full data-[expanded=true]:top-0 transition-all"
    :class="{ 'left-[35%]': condensed }"
    :data-expanded="show"
  >
    <div
      class="p-3 relative h-full text-sm text-neutral-400 overflow-hidden shrink overflow-ellipsis"
      :class="{
        block: show,
        hidden: !show,
      }"
    >
      <div
        class="preview-image"
        :class="{ 'w-[40%]': !condensed, 'w-0': condensed }"
      >
        <ConjurationPrimaryImage :conjuration="conjuration" />
      </div>
      <div class="text-lg text-white mb-1">
        {{ conjuration.name }}
      </div>
      {{ getConjurationDescription() }}

      <div
        class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-surface-2"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.preview-image img {
  border-radius: 12px;
  margin-right: 10px;
  aspect-ratio: 1/1;
  text-align: center;
  float: left;
  object-fit: cover;
  shape-outside: square();
}
</style>
