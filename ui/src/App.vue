<script setup lang="ts">
import Navbar from "@/components/Navigation/NavBar.vue";
import { useAuthStore } from "@/store";
import NotificationHandler from "@/components/Notifications/NotificationHandler.vue";

const authStore = useAuthStore();
</script>

<template>
  <div class="block h-screen bg-surface text-white md:flex">
    <Navbar
      v-if="!!authStore.tokens"
      class="mr-4 w-full border-r-[2px] border-white/20 md:w-[250px]"
    />
    <div
      class="h-min-screen mb-3 flex h-full w-full flex-col overflow-y-scroll p-3"
    >
      <router-view />
    </div>
    <NotificationHandler />
  </div>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
