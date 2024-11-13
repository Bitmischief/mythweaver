<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onBeforeMount, onUpdated, ref, watch } from 'vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import Loader from './components/Core/Loader.vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showSuccess } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import mixpanel from 'mixpanel-browser';
import { useRoute } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import { fbq, rdt } from '@/lib/conversions.ts';
import AuthenticatedView from '@/components/Core/AuthenticatedView.vue';

const authStore = useAuthStore();
const eventBus = useEventBus();
const intercom = useIntercom();
const route = useRoute();

const showPreorderRedemptionModal = ref(false);
const { isLoading, isAuthenticated } = useAuth0();
const showUserSourceModal = ref(false);

onBeforeMount(async () => {
  if (location.pathname.startsWith('/invite')) {
    await authStore.clearCache();
  }
});

watch(isAuthenticated, async (isAuthenticated) => {
  if (isAuthenticated) {
    await authStore.loadCurrentUser();
    await initIntercom();
  }
});

onMounted(async () => {
  eventBus.$on('user-loaded', async () => {
    await initIntercom();
    await initNotifications();

    const user = useAuthStore().user;

    if (user) {
      mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN as string);

      mixpanel.alias(user.id.toString());

      if (!user.onboarded) {
        fbq('track', 'Lead');
        rdt('track', 'SignUp');
        rdt('track', 'Lead');

        showUserSourceModal.value = true;
      }

      if (user.preorderRedemptionCoupon) {
        showPreorderRedemptionModal.value = true;
      }
    }
  });
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
      route: `/sessions/${sessionId}`,
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
</script>

<template>
  <div class="block h-screen bg-surface-2 text-white md:flex overflow-hidden">
    <Navbar v-if="!!authStore.user" class="w-full md:max-w-[256px]" />
    <div class="block w-full overflow-hidden">
      <AuthenticatedView v-if="!isLoading && isAuthenticated && authStore.user" />
      <div v-else-if="!isLoading && route.meta.noAuth">
        <router-view></router-view>
      </div>
    </div>
    <NotificationHandler />

    <div
      v-if="isLoading || authStore.isLoading || showLoading"
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
</template>
