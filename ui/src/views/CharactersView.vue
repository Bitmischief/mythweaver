<template>
  <div class="">
    <div class="mb-4 flex justify-between">
      <div class="text-2xl">Characters</div>
      <router-link
        :to="`/characters/new`"
        class="text-md flex rounded-xl bg-purple-500 px-2"
      >
        <PlusIcon class="mr-1 h-5 w-5 self-center" />
        <span class="self-center">Character</span>
      </router-link>
    </div>

    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon } from "@heroicons/vue/24/solid";
</script>
