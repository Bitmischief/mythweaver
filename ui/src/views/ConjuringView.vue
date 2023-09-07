<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const showHeader = computed(
  () => !route.path.startsWith('/conjurations/view/'),
);
</script>

<template>
  <div v-if="showHeader" class="h-full p-4">
    <div class="mb-4 flex justify-between">
      <div class="text-2xl">Conjure something magical</div>
    </div>

    <router-view></router-view>
  </div>

  <router-view v-else></router-view>
</template>
