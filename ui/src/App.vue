<script setup lang="ts">
import Navbar from "@/components/Navigation/Navbar.vue";
import {useAuthStore} from "@/store";

const authStore = useAuthStore();
</script>

<template>
  <div class="block h-full md:flex bg-surface text-white">
    <Navbar v-if="!!authStore.tokens" class="w-full md:w-[250px] border-white/20 border-r-[2px] mr-4" />
    <div class="flex flex-col w-full">
      <router-view />
    </div>
  </div>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
