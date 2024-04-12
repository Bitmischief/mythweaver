<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onBeforeMount, onUpdated, ref } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import Loader from './components/Core/Loader.vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showSuccess } from '@/lib/notifications.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import CreateRelationship from '@/components/Relationships/CreateRelationship.vue';
import { useLDClient, useLDReady } from 'launchdarkly-vue-client-sdk';
import UpgradeContainer from '@/components/Core/Billing/UpgradeContainer.vue';
import mixpanel from 'mixpanel-browser';
import { getRedeemPreOrderUrl } from '@/api/billing.ts';

const ldReady = useLDReady();
const authStore = useAuthStore();
const eventBus = useEventBus();
const intercom = useIntercom();
const ldClient = useLDClient();

const showPreorderRedemptionModal = ref(false);

onBeforeMount(async () => {
  if (
    location.pathname.startsWith('/auth/magic-link') ||
    location.pathname.startsWith('/invite')
  ) {
    await authStore.clearCache();
  }
});

onMounted(async () => {
  eventBus.$on('user-loaded', async () => {
    await initIntercom();
    await initNotifications();

    const user = useAuthStore().user;

    if (user) {
      await ldClient.identify({
        kind: 'user',
        key: user.id.toString(),
        email: user.email,
        name: user.username,
        custom: {
          plan: user.plan,
        },
      });

      mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN as string);
      mixpanel.identify(user.id.toString());

      if (user.preorderRedemptionCoupon) {
        showPreorderRedemptionModal.value = true;
      }
    }
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
  negativePrompt: string;
  stylePreset: string;
  seed: string;
  imageId: number;
  linking?: {
    sessionId?: number;
    characterId?: number;
    conjurationId?: number;
  };
}
eventBus.$on('toggle-customize-image-modal', (args: CustomizeImageRequest) => {
  showCustomizeImageModal.value = !showCustomizeImageModal.value;

  if (!args) {
    customizeImageArgs.value = undefined;
  } else {
    customizeImageArgs.value = args;
  }
});

const showCreateRelationshipModal = ref(false);
const createRelationshipArgs = ref<CreateRelationshipRequest | undefined>(
  undefined,
);
export interface CreateRelationshipRequest {
  relationshipType: ConjurationRelationshipType;
  nodeId: number;
  nodeType: ConjurationRelationshipType;
}
eventBus.$on('create-relationship', (args: CreateRelationshipRequest) => {
  showCreateRelationshipModal.value = !showCreateRelationshipModal.value;
  if (!args) {
    createRelationshipArgs.value = undefined;
  } else {
    createRelationshipArgs.value = args;
  }
});

async function navigateToPreOrderRedemptionUrl() {
  const response = await getRedeemPreOrderUrl();
  location.href = response.data;
}
</script>

<template>
  <div class="block h-screen bg-surface-2 text-white md:flex overflow-hidden">
    <Navbar v-if="!!authStore.user" class="w-full md:max-w-[256px]" />
    <div class="block w-full overflow-hidden">
      <div
        v-if="!!authStore.user"
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
          'pb-6 mb-6 bg-surface p-5 md:px-8': !!authStore.user,
        }"
        :style="{
          height: `${!!authStore.user ? 'calc(100vh - 4.1rem)' : 'auto'}`,
        }"
      >
        <router-view />
      </div>
    </div>
    <NotificationHandler />

    <div
      v-if="authStore.isLoading || showLoading || !ldReady"
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
      class="pt-8 md:p-6 md:px-12 bg-surface-2 rounded-[20px] min-w-[70vw] text-white text-center mb-12"
    >
      <CustomizeConjurationImage
        :prompt="customizeImageArgs?.prompt"
        :negative-prompt="customizeImageArgs?.negativePrompt"
        :image-uri="customizeImageArgs?.imageUri"
        :looks="customizeImageArgs?.stylePreset"
        :seed="customizeImageArgs?.seed"
        :image-id="customizeImageArgs?.imageId"
        :linking="customizeImageArgs?.linking"
        in-modal
        @cancel="showCustomizeImageModal = false"
      />
    </div>
  </ModalAlternate>

  <ModalAlternate
    :show="showCreateRelationshipModal"
    extra-dark
    @close="showCreateRelationshipModal = false"
  >
    <div
      class="min-w-[40vw] max-w-[90vw] h-[90vh] p-6 bg-surface-2 rounded-[20px] text-neutral-300"
    >
      <CreateRelationship
        v-if="!!createRelationshipArgs"
        :relationship-type="createRelationshipArgs.relationshipType"
        :node-id="createRelationshipArgs?.nodeId"
        :node-type="createRelationshipArgs?.nodeType"
        @close="showCreateRelationshipModal = false"
      />
    </div>
  </ModalAlternate>

  <UpgradeContainer />

  <ModalAlternate
    :show="showPreorderRedemptionModal"
    extra-dark
    @close="showPreorderRedemptionModal = false"
  >
    <div
      class="min-w-[40vw] md:max-w-[50vw] max-w-[90vw] p-6 bg-surface-2 rounded-[20px]"
    >
      <div
        class="text-4xl font-medium text-center text-transparent bg-clip-text bg-gradient-to-r from-[#E5AD59] to-[#E95252]"
      >
        <div>Your MythWeaver Subscription Is Ready!</div>
      </div>

      <div class="mt-6 flex justify-center">
        <button
          class="button-gradient text-white text-lg md:text-2xl"
          @click="navigateToPreOrderRedemptionUrl"
        >
          Activate Pre-Ordered Subscription
        </button>
      </div>

      <div class="mt-6 flex justify-center text-white">
        <div>
          <div class="text-2xl text-neutral-400">What do I have to do?</div>
          <div class="text-xl text-neutral-200">
            Click the button above to activate your pre-ordered subscription.
            You will be asked for your billing address, for tax purposes, and
            payment information, to continue your subscription after your
            pre-purchased subscription ends.
          </div>

          <div class="mt-6 text-2xl text-neutral-400">
            Why do I have to do this?
          </div>
          <div class="text-xl text-neutral-200">
            Now that MythWeaver has publicly launched, early access has ended.
            To continue using your pre-ordered subscription, we need to register
            your information in our subscription system.
          </div>

          <div class="mt-6 text-2xl text-neutral-400">
            Why do I have to enter payment information?
          </div>
          <div class="text-xl text-neutral-200">
            Even though you have pre-ordered, our subscription system requires
            your payment information to continue your subscription after your
            pre-purchased subscription ends.
          </div>

          <div class="mt-6 text-2xl text-neutral-400">
            Can I cancel my subscription after activating?
          </div>
          <div class="text-xl text-neutral-200">
            Yes, you can cancel your subscription at any time. You will still be
            able to use your subscription until the end of the current billing
            cycle.
          </div>

          <div class="mt-6 text-2xl text-neutral-400">
            What if I have other questions?
          </div>
          <div class="text-xl text-neutral-200">
            Feel free to reach out to us in the chat bubble in the lower right
            of your screen in the MythWeaver app, or email us at
            <a
              href="mailto:support@mythweaver.co"
              class="text-fuchsia-500 underline"
              >support@mythweaver.co</a
            >
          </div>
        </div>
      </div>
    </div>
  </ModalAlternate>

  <LightboxRoot />
</template>
