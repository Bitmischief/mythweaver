<script setup lang="ts">
import { useAuthStore } from '@/store';
import { useEventBus } from '@/lib/events';
import { useIntercom } from '@homebaseai/vue3-intercom';
import { useCurrentUserPlan, useWebsocketChannel } from '@/lib/hooks';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ServerEvent } from '@/lib/serverEvents';
import { showSuccess } from '@/lib/notifications';
import mixpanel from 'mixpanel-browser';
import { fbq, rdt } from '@/lib/conversions';
import { reportInitialTrackingData } from '@/lib/tracking';
import ModalAlternate from '@/components/ModalAlternate.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';
import UpgradeContainer from '@/components/Core/Billing/UpgradeContainer.vue';
import PricingTable from '@/components/Core/PricingTable.vue';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import { BillingPlan } from '@/api/users.ts';
import { SparklesIcon } from '@heroicons/vue/24/outline';
import UserSignupSource from '@/components/Core/UserSignupSource.vue';
import { DndProvider } from 'vue3-dnd';
import EditImageModal from '@/modules/images/components/edit/EditImageModal.vue';
import CreateConjurationRelationship from '@/components/Relationships/Create/CreateConjurationRelationship.vue';
import GenerateImageModal from '@/modules/images/components/generate/GenerateImageModal.vue';
import { getRedeemPreOrderUrl } from '@/api/billing.ts';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ImageHistoryModal from '@/modules/images/components/history/ImageHistoryModal.vue';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
// @ts-ignore
import { HTML5Backend } from 'react-dnd-html5-backend';

const authStore = useAuthStore();
const eventBus = useEventBus();
const intercom = useIntercom();
const route = useRoute();

const showPreorderRedemptionModal = ref(false);
const showUpgradeModal = ref(false);
const showUserSourceModal = ref(false);

const currentUserPlan = useCurrentUserPlan();

onMounted(async () => {
  await initIntercom();
  await initNotifications();

  const user = authStore.user;

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

async function navigateToPreOrderRedemptionUrl() {
  const response = await getRedeemPreOrderUrl();
  location.href = response.data;
}

async function finishOnboarding(sourceInfo: {
  source: string;
  influencer: string | undefined;
}) {
  await reportInitialTrackingData(sourceInfo.source, sourceInfo.influencer);
  showUserSourceModal.value = false;
  showSuccess({ message: 'Thank you for taking the time to fill that out!' });
}

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

eventBus.$on('show-subscription-modal', () => {
  showUpgradeModal.value = true;
});
</script>

<template>
  <div class="hidden md:flex border-b border-zinc-900">
    <div class="w-full bg-surface-2 z-20 h-[4rem] flex">
      <NavBarHeader />
    </div>
  </div>

  <div
    id="view-parent"
    class="flex w-full flex-col overflow-y-auto md:rounded-tr-none pb-6 mb-6 bg-surface p-5 md:px-8"
    :class="{
      'blur pointer-events-none overflow-hidden':
        route.meta.paidRequired && currentUserPlan === BillingPlan.Free,
    }"
    :style="{
      height: 'calc(100vh - 4.1rem)',
    }"
  >
    <DndProvider :backend="HTML5Backend">
      <router-view />
    </DndProvider>
  </div>

  <div
    v-if="route.meta.paidRequired && currentUserPlan === BillingPlan.Free"
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

  <NotificationHandler />

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

  <EditImageModal />
  <GenerateImageModal />
  <ImageHistoryModal />
  <LightboxRoot />
</template>
