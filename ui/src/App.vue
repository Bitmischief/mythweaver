<script setup lang="ts">
import Navbar from "@/components/Navigation/NavBar.vue";
import { useAuthStore } from "@/store";
import NotificationHandler from "@/components/Notifications/NotificationHandler.vue";
import { NO_CAMPAIGNS_EVENT, useEventBus } from "@/lib/events.ts";
import router from "@/router/router.ts";
import { onMounted } from "vue";
import NavBarHeader from "@/components/Navigation/NavBarHeader.vue";

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
  <div class="block h-screen bg-surface-2 text-white md:flex">
    <Navbar v-if="!!authStore.tokens" class="w-full md:max-w-[300px]" />
    <div class="block w-full">
      <div
        v-if="!!authStore.tokens"
        class="flex justify-end mr-4 bg-surface-2 h-[5rem]"
      >
        <NavBarHeader />
      </div>
      <div
        class="flex w-full flex-col overflow-y-auto bg-surface"
        :class="{ 'rounded-tl-2xl pb-6': !!authStore.tokens }"
        :style="{ 'height: calc(100vh - 5rem)': !!authStore.tokens }"
      >
        <router-view />
      </div>
    </div>
    <NotificationHandler />
  </div>
</template>
