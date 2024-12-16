<script setup lang="ts">
import { useConjurationStore } from '../../store/conjuration.store';
import { mapConjurationType } from '@/lib/util';
import { useConjurationListFilters } from '../../composables/useConjurationListFilters';
import { X } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

const { filtersApplied } = useConjurationListFilters();
const { conjurationListFilters } = storeToRefs(useConjurationStore());
const { clearConjurationListFilters } = useConjurationStore();

const removeCode = (code: string) => {
  conjurationListFilters.value.conjurerCodes =
    conjurationListFilters.value.conjurerCodes.filter((t) => t !== code);
};

const removeTag = (tag: string) => {
  conjurationListFilters.value.tags = conjurationListFilters.value.tags.filter(
    (t: string) => t !== tag,
  );
};
</script>

<template>
  <div class="flex mt-1">
    <div
      v-if="filtersApplied"
      class="tag flex gap-1 cursor-pointer bg-transparent border border-gray-700"
      @click="clearConjurationListFilters"
    >
      Clear Filters
      <X class="w-4 h-4" />
    </div>
    <div
      v-for="code in conjurationListFilters.conjurerCodes"
      :key="code"
      class="tag cursor-pointer group flex items-center gap-1"
      @click="removeCode(code)"
    >
      {{ mapConjurationType(code) }}
      <X class="hidden group-hover:block w-4 h-4" />
    </div>
    <div
      v-for="tag in conjurationListFilters.tags"
      :key="tag"
      class="tag cursor-pointer group flex items-center gap-1"
      @click="removeTag(tag)"
    >
      {{ tag }}
      <X class="hidden group-hover:block w-4 h-4" />
    </div>
  </div>
</template>
