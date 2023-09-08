<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import { NO_CAMPAIGNS_EVENT, useEventBus } from '@/lib/events.ts';
import router from '@/router/router.ts';
import { onMounted } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';

const authStore = useAuthStore();
const eventBus = useEventBus();

onMounted(async () => {
  if (authStore.tokens) {
    await authStore.loadCurrentUser();
  }
});

eventBus.$on(NO_CAMPAIGNS_EVENT, () => {
  router.push('/campaigns/new');
});
</script>

<template>
  <div class="block h-screen bg-surface-2 text-white md:flex">
    <Navbar v-if="!!authStore.tokens" class="w-full md:max-w-[300px]" />
    <div class="block w-full">
      <div
        v-if="!!authStore.tokens"
        class="justify-end mr-4 bg-surface-2 h-[5rem] hidden md:flex"
      >
        <NavBarHeader />
      </div>

      <div
        id="view-parent"
        class="flex w-full flex-col overflow-y-auto rounded-tr-2xl md:rounded-tr-none"
        :class="{ 'rounded-tl-2xl pb-6  bg-surface p-4': !!authStore.tokens }"
        :style="{
          height: `${!!authStore.tokens ? 'calc(100vh - 5rem)' : 'auto'}`,
        }"
      >
        <router-view />
      </div>
    </div>
    <NotificationHandler />

    <div
      v-if="authStore.isLoading"
      class="absolute w-full h-full bg-black opacity-95"
    >
      <div class="flex justify-center items-center w-full h-full">
        <div
          class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"
        ></div>
      </div>
    </div>
  </div>
</template>
