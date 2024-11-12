<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onBeforeMount, onUpdated, ref, watch } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import Loader from './components/Core/Loader.vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showSuccess } from '@/lib/notifications.ts';
import { useCurrentUserPlan, useWebsocketChannel } from '@/lib/hooks.ts';
import UpgradeContainer from '@/components/Core/Billing/UpgradeContainer.vue';
import mixpanel from 'mixpanel-browser';
import { getRedeemPreOrderUrl } from '@/api/billing.ts';
import PricingTable from '@/components/Core/PricingTable.vue';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import { BillingPlan } from '@/api/users.ts';
import { SparklesIcon } from '@heroicons/vue/24/outline';
import { useRoute } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import { reportInitialTrackingData } from '@/lib/tracking.ts';
import ConjureImage from '@/components/Conjure/ConjureImage.vue';
import { fbq, rdt } from '@/lib/conversions.ts';
import UserSignupSource from '@/components/Core/UserSignupSource.vue';
import { DndProvider } from 'vue3-dnd';
import EditImageModal from './components/Images/EditImageModal.vue';

// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend';
import CreateConjurationRelationship from '@/components/Relationships/Create/CreateConjurationRelationship.vue';

const authStore = useAuthStore();
const eventBus = useEventBus();
const intercom = useIntercom();
const currentUserPlan = useCurrentUserPlan();
const route = useRoute();

const showPreorderRedemptionModal = ref(false);
const showUpgradeModal = ref(false);
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

const showCustomizeImageModal = ref(false);
const customizeImageArgs = ref<CustomizeImageRequest | undefined>(undefined);

export interface CustomizeImageRequest {
  image?: {
    id: number;
    uri: string;
    prompt: string;
    negativePrompt: string;
    stylePreset: string;
    seed: string;
  };
  linking?: {
    sessionId?: number;
    characterId?: number;
    conjurationId?: number;
  };
  historyMode?: boolean;
  showImageCredits?: boolean;
}

eventBus.$on('toggle-customize-image-modal', (args: CustomizeImageRequest) => {
  showCustomizeImageModal.value = !showCustomizeImageModal.value;

  if (!args) {
    customizeImageArgs.value = undefined;
  } else {
    customizeImageArgs.value = args;
  }
});

const showEditImageModal = ref(false);
const editImageArgs = ref<EditImageRequest | undefined>(undefined);

export interface EditImageRequest {
  image?: {
    id: number;
    uri: string;
    prompt: string;
    negativePrompt: string;
    stylePreset: string;
    seed: string;
  };
}

eventBus.$on('toggle-edit-image-modal', (args: EditImageRequest) => {
  showEditImageModal.value = !showEditImageModal.value;

  if (!args) {
    editImageArgs.value = undefined;
  } else {
    editImageArgs.value = args;
  }
});

const showCreateRelationshipModal = ref(false);
const createRelationshipArgs = ref<CreateRelationshipRequest | undefined>(
  undefined,
);

export interface CreateRelationshipRequest {
  conjurationId: number;
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

eventBus.$on('show-subscription-modal', () => {
  showUpgradeModal.value = true;
});

async function finishOnboarding(sourceInfo: {
  source: string;
  influencer: string | undefined;
}) {
  await reportInitialTrackingData(sourceInfo.source, sourceInfo.influencer);
  showUserSourceModal.value = false;
  showSuccess({ message: 'Thank you for taking the time to fill that out!' });
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
        <div class="w-full bg-surface-2 z-20 h-[4rem] flex">
          <NavBarHeader />
        </div>
      </div>

      <div
        v-if="!isLoading && isAuthenticated && authStore.user"
        id="view-parent"
        class="flex w-full flex-col overflow-y-auto md:rounded-tr-none"
        :class="{
          'pb-6 mb-6 bg-surface p-5 md:px-8': !!authStore.user,
          'blur pointer-events-none overflow-hidden':
            route.meta.paidRequired && currentUserPlan === BillingPlan.Free,
        }"
        :style="{
          height: `${!!authStore.user ? 'calc(100vh - 4.1rem)' : 'auto'}`,
        }"
      >
        <DndProvider :backend="HTML5Backend">
          <router-view />
        </DndProvider>
      </div>
      <div
        v-if="
          !isLoading &&
          isAuthenticated &&
          authStore.user &&
          !(authStore.isLoading || showLoading) &&
          route.meta.paidRequired &&
          currentUserPlan === BillingPlan.Free
        "
        class="absolute top-1/4 left-1/2 -translate-x-1/2 bg-surface rounded-[12px] w-[90vw] md:w-auto"
      >
        <div
          class="border border-[#5A32AA7F] upgrade-box p-12 rounded-[12px] text-neutral-200"
        >
          <div class="mt-1 mb-2 text-xl flex">
            <SparklesIcon class="h-8 w-8 mr-1" />
            <div class="self-center">Upgrade to pro</div>
          </div>
          <div class="mt-1 mb-4 text-neutral-400">
            You have to upgrade your plan to use this feature
          </div>
          <button
            class="bg-gradient-to-tr from-[#E95252] to-[#E5AD59] w-full rounded-[6px] py-2 px-4"
            @click="eventBus.$emit('show-subscription-modal')"
          >
            Upgrade plan
          </button>
        </div>
      </div>
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

  <ModalAlternate :show="showCustomizeImageModal" extra-dark>
    <div
      class="relative pt-2 md:m-6 md:p-6 md:px-12 bg-surface-2 rounded-[20px] min-w-[70vw] max-w-[90vw] text-white mb-12"
    >
      <ConjureImage
        :image="customizeImageArgs?.image"
        :linking="customizeImageArgs?.linking"
        :history-mode="customizeImageArgs?.historyMode"
        :show-image-credits="customizeImageArgs?.showImageCredits"
        in-modal
        @cancel="showCustomizeImageModal = false"
      />
    </div>
  </ModalAlternate>

  <ModalAlternate :show="showEditImageModal" extra-dark>
    <div class="relative min-w-[100vw] min-h-[100vh] text-white">
      <EditImageModal
        :image="editImageArgs?.image"
        @close="showEditImageModal = false"
      />
    </div>
  </ModalAlternate>

  <ModalAlternate
    :show="showCreateRelationshipModal"
    extra-dark
    @close="showCreateRelationshipModal = false"
  >
    <div
      class="min-w-[40vw] max-w-[90vw] h-[90vh] p-6 bg-surface-2 rounded-[20px] text-neutral-300 overflow-hidden"
    >
      <CreateConjurationRelationship
        v-if="!!createRelationshipArgs"
        :conjuration-id="createRelationshipArgs?.conjurationId"
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

  <ModalAlternate
    :show="showUpgradeModal"
    extra-dark
    @close="showUpgradeModal = false"
  >
    <div
      class="w-[90vw] md:w-[70vw] xl:w-[60vw] p-6 bg-surface-2 rounded-[20px] border border-surface-3"
    >
      <div class="flex gap-4 justify-between text-neutral-300">
        <div class="text-xl mb-6">Subscription Plans</div>
        <XCircleIcon
          class="h-6 w-6 cursor-pointer"
          @click="showUpgradeModal = false"
        />
      </div>

      <PricingTable />
    </div>
  </ModalAlternate>

  <ModalAlternate :show="showUserSourceModal" extra-dark>
    <div
      class="relative pt-8 md:m-6 md:p-6 md:px-12 bg-surface-2 rounded-[20px] min-w-[70vw] text-white mb-12"
    >
      <UserSignupSource @finish-onboarding="finishOnboarding" />
    </div>
  </ModalAlternate>

  <LightboxRoot />
</template>
