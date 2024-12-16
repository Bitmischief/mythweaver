<script setup lang="ts">
import { LayoutGrid, StretchHorizontal } from 'lucide-vue-next';
import { useCondensedView } from '@/modules/core/composables/useCondensedView';

const { condensed, setCondensed } = useCondensedView();
</script>

<template>
  <Button
    class="button-primary text-neutral-300 px-2 self-center cursor-pointer"
    @click="setCondensed(!condensed)"
  >
    <LayoutGrid v-if="condensed" class="h-6 w-6 self-center" />
    <StretchHorizontal v-else class="h-6 w-6 self-center" />
  </Button>
</template>
