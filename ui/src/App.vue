<script setup lang="ts">
import Navbar from "@/components/Navigation/NavBar.vue";
import { useAuthStore } from "@/store";
import NotificationHandler from "@/components/Notifications/NotificationHandler.vue";
import { NO_CAMPAIGNS_EVENT, useEventBus } from "@/lib/events.ts";
import router from "@/router/router.ts";
import { onMounted } from "vue";

const authStore = useAuthStore();
const eventBus = useEventBus();

onMounted(async () => {
  await authStore.loadCurrentUser();
});

eventBus.$on(NO_CAMPAIGNS_EVENT, () => {
  router.push("/campaigns/new");
});
</script>

<template>
  <div class="block h-screen bg-surface text-white md:flex">
    <Navbar
      v-if="!!authStore.tokens"
      class="w-full border-r-[2px] border-white/5 md:max-w-[300px]"
    />
    <div
      class="bg h-min-screen mb-3 flex h-full w-full flex-col overflow-y-auto"
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

.bg {
  background: rgb(23, 23, 23);
  background: linear-gradient(
    135deg,
    rgba(23, 23, 23, 1) 60%,
    rgba(38, 34, 39, 1) 76%,
    rgba(140, 88, 154, 0.6279761904761905) 100%
  );
}
</style>
