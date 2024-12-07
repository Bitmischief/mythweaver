<script setup lang="ts">
import ConjurationListSearch from './conjurationListSearch.vue';
import ConjurationListFilter from './conjurationListFilter.vue';
import ConjurationListFilterPreview from './conjurationListFilterPreview.vue';
import { Sparkles } from 'lucide-vue-next';
</script>

<template>
  <div class="mb-4">
    <div class="flex items-center gap-2">
      <ConjurationListSearch />
      <ConjurationListFilter />
      <div>
        <router-link to="/conjure" class="flex">
          <button class="button-gradient flex self-center">
            <Sparkles class="mr-2 h-5 w-5 self-center" />
            <span class="self-center">Create</span>
          </button>
        </router-link>
      </div>
    </div>
    <ConjurationListFilterPreview />
  </div>
</template>
