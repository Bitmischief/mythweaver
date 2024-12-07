<script setup lang="ts">
import Search from '@/modules/core/components/inputs/search.vue';
import { useConjurationStore } from '@/modules/conjurations/store/conjuration.store';
import { storeToRefs } from 'pinia';

const { conjurationListFilters } = storeToRefs(useConjurationStore());
</script>

<template>
  <Search v-model="conjurationListFilters.search" />
</template>
