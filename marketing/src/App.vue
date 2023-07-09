<script setup lang="ts">
import NotificationHandler from "@/components/Notifications/NotificationHandler.vue";
</script>

<template>
  <div class="flex h-full w-full justify-center bg-surface text-white">
    <router-view />
    <NotificationHandler />
  </div>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
