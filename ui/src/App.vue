<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import {
  CAMPAIGN_CREATED_EVENT,
  NO_CAMPAIGNS_EVENT,
  useEventBus,
} from '@/lib/events.ts';
import { onMounted, ref } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import NewCampaign from '@/components/Campaigns/NewCampaign.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';

const authStore = useAuthStore();
const eventBus = useEventBus();

onMounted(async () => {
  if (authStore.tokens) {
    await authStore.loadCurrentUser();
  }
});

const showCreateCampaign = ref(false);

eventBus.$on(NO_CAMPAIGNS_EVENT, () => {
  showCreateCampaign.value = true;
});

eventBus.$on(CAMPAIGN_CREATED_EVENT, () => {
  showCreateCampaign.value = false;
});

const showLoading = ref(false);
eventBus.$on('global-loading-start', () => {
  showLoading.value = true;
});

eventBus.$on('global-loading-stop', () => {
  showLoading.value = false;
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
      v-if="authStore.isLoading || showLoading"
      class="absolute w-full h-full bg-black opacity-95"
    >
      <div class="flex justify-center items-center w-full h-full">
        <div
          class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"
        ></div>
      </div>
    </div>
  </div>

  <ModalAlternate :show="showCreateCampaign">
    <div class="md:w-[800px] p-6 bg-neutral-900 rounded-[20px]">
      <NewCampaign />
    </div>
  </ModalAlternate>

  <LightboxRoot />
</template>
