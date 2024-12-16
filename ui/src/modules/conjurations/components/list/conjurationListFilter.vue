<script setup lang="ts">
import { Filter } from 'lucide-vue-next';
import ConjurationListFilterModal from './conjurationListFilterModal.vue';
import { useConjurationListFilters } from '../../composables/useConjurationListFilters';

const { showFilters } = useConjurationListFilters();
</script>

<template>
  <button class="button-primary flex self-center" @click="showFilters = true">
    <Filter class="w-5 h-5 mr-2" />
    <span class="text-white text-sm font-normal">Filters</span>
  </button>

  <ConjurationListFilterModal v-model="showFilters" />
</template>
