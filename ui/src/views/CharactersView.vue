<template>
  <div class="">
    <div class="flex justify-between mb-4">
      <div class="text-2xl">Characters</div>
      <router-link :to="`/characters/new`" class="bg-purple-500 rounded-xl px-2 text-md">
        Generate Character
      </router-link>
    </div>

    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
</script>
