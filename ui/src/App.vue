<script setup lang="ts">
import Navbar from "@/components/Navigation/Navbar.vue";
import {useAuthStore} from "@/store";
import NotificationHandler
  from "@/components/Notifications/NotificationHandler.vue";

const authStore = useAuthStore();
</script>

<template>
  <div class="block h-screen md:flex bg-surface text-white">
    <Navbar v-if="!!authStore.tokens" class="w-full md:w-[250px] border-white/20 border-r-[2px] mr-4" />
    <div class="flex flex-col w-full h-full h-min-screen p-3 mb-3 overflow-y-scroll">
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
