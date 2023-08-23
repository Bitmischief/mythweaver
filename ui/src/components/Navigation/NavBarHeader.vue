<script setup lang="ts">
import { MagnifyingGlassIcon } from "@heroicons/vue/20/solid";
</script>

<template>
  <div class="relative self-center">
    <div class="absolute left-4 top-3 flex">
      <MagnifyingGlassIcon class="h-6 w-6 self-center text-gray-400" />
    </div>
    <input
      class="self-center w-[408px] h-12 bg-zinc-950 rounded-[60px] pl-14"
      placeholder="Search"
    />
  </div>
</template>
