<script setup lang="ts">
import { ref } from 'vue';
import ConjurationPrimaryImage from '../core/conjurationPrimaryImage.vue';
import ConjurationTags from '../core/conjurationTags.vue';
import { useCondensedView } from '@/modules/core/composables/useCondensedView';
import { Conjuration } from '@/modules/conjurations/types';
import { useRoute } from 'vue-router';
import ConjurationListItemActions from './conjurationListItemActions.vue';
import ConjurationListItemPreview from './conjurationListItemPreview.vue';

const route = useRoute();
const { condensed } = useCondensedView();
const preview = ref(false);

defineProps<{
  conjuration: Conjuration;
}>();
</script>

<template>
  <div class="relative rounded-[20px] shadow-xl bg-surface-2">
    <router-link
      class="rounded-[20px] p-2 bg-surface-2 flex gap-2 group relative"
      :class="{
        'flex-col justify-end': !condensed,
        'flex-row': condensed,
      }"
      :to="{
        path: `/conjurations/view/${conjuration.id}`,
        query: { from: route.fullPath },
      }"
    >
      <div
        :class="{
          'basis-1/3 my-auto': condensed,
          'basis-1': !condensed,
        }"
      >
        <ConjurationPrimaryImage :conjuration="conjuration" />
      </div>
      <div
        class="flex grow justify-between px-1 pb-1 rounded-[20px] bg-surface-2 group-hover:grow transition-all"
        :class="{
          'basis-1': !condensed,
          'basis-2/3 pt-2 overflow-hidden': condensed,
        }"
      >
        <div class="max-w-[100%] grow flex flex-col">
          <div class="relative text-md truncate mb-1">
            {{ conjuration.name }}
          </div>
          <ConjurationTags :conjuration="conjuration" />
          <ConjurationListItemActions
            :conjuration="conjuration"
            @toggle-preview="preview = $event"
          />
        </div>
      </div>
      <ConjurationListItemPreview :conjuration="conjuration" :show="preview" />
    </router-link>
  </div>
</template>
