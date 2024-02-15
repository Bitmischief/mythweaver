<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onUpdated, ref } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import Loader from './components/Core/Loader.vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showSuccess } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';

const authStore = useAuthStore();
const eventBus = useEventBus();
const intercom = useIntercom();

onMounted(async () => {
  eventBus.$on('user-loaded', async () => {
    await initIntercom();
    await initNotifications();
  });

  if (authStore.tokens) {
    await authStore.loadCurrentUser();
  }

  await initIntercom();
});

onUpdated(async () => {
  await initIntercom();
});

async function initNotifications() {
  const channel = useWebsocketChannel();
  channel.bind(ServerEvent.TranscriptionComplete, (sessionId: number) => {
    showSuccess({
      message: 'Transcription Complete',
      context: 'Click here to view transcription',
      route: `/sessions/${sessionId}/transcription`,
    });
  });
}

async function initIntercom() {
  await intercom.boot({
    app_id: import.meta.env.VITE_INTERCOM_APP_TOKEN as string,
    user_id: authStore.user?.id,
    name: authStore.user?.email,
    email: authStore.user?.email,
    created_at: authStore.user?.createdAt,
  } as any);
}

const showLoading = ref(false);
eventBus.$on('global-loading-start', () => {
  showLoading.value = true;
});

eventBus.$on('global-loading-stop', () => {
  showLoading.value = false;
});

const showCustomizeImageModal = ref(false);
const customizeImageArgs = ref<CustomizeImageRequest | undefined>(undefined);
export interface CustomizeImageRequest {
  imageUri: string;
  prompt: string;
  looks: string;
}
eventBus.$on('toggle-customize-image-modal', (args: CustomizeImageRequest) => {
  showCustomizeImageModal.value = !showCustomizeImageModal.value;

  if (!args) {
    customizeImageArgs.value = undefined;
  } else {
    customizeImageArgs.value = args;
  }
});
</script>

<template>
  <div class="block h-screen bg-surface-2 text-white md:flex">
    <Navbar v-if="!!authStore.tokens" class="w-full md:max-w-[256px]" />
    <div class="block w-full">
      <div
        v-if="!!authStore.tokens"
        class="hidden md:flex border-b border-zinc-900"
      >
        <div class="w-full bg-surface-2 z-10 h-[4rem] flex justify-end">
          <NavBarHeader />
        </div>
      </div>

      <div
        id="view-parent"
        class="flex w-full flex-col overflow-y-auto md:rounded-tr-none"
        :class="{
          'pb-6 mb-6 bg-surface p-5 px-8': !!authStore.tokens,
        }"
        :style="{
          height: `${!!authStore.tokens ? 'calc(100vh - 4.1rem)' : 'auto'}`,
        }"
      >
        <router-view />
      </div>
    </div>
    <NotificationHandler />

    <div
      v-if="authStore.isLoading || showLoading"
      class="absolute w-full h-full bg-surface opacity-95"
    >
      <div class="flex justify-center items-center w-full h-full">
        <div>
          <Loader />
          <div class="text-2xl mt-4">Loading...</div>
        </div>
      </div>
    </div>
  </div>

  <ModalAlternate :show="showCustomizeImageModal" extra-dark>
    <div
      class="p-2 md:p-6 md:px-12 pb-6 bg-surface-2 rounded-[20px] text-white text-center"
    >
      <CustomizeConjurationImage
        :prompt="customizeImageArgs?.prompt"
        :image-uri="customizeImageArgs?.imageUri"
        :looks="customizeImageArgs?.looks"
        in-modal
        @cancel="showCustomizeImageModal = false"
      />
    </div>
  </ModalAlternate>

  <LightboxRoot />
</template>
