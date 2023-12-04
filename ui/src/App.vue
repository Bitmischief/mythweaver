<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import {
  CAMPAIGN_CREATED_EVENT,
  NO_CAMPAIGNS_EVENT,
  useEventBus,
} from '@/lib/events.ts';
import { computed, onMounted, onUpdated, ref } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import NewCampaign from '@/components/Campaigns/NewCampaign.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';
import { useEarlyAccessStore } from '@/store/earlyAccess.store.ts';
import { storeToRefs } from 'pinia';
import { SparklesIcon } from '@heroicons/vue/20/solid';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import { patchCurrentUser } from '@/api/users.ts';
import { showError } from '@/lib/notifications.ts';
import { useEarlyAccessExempt } from '@/lib/hooks.ts';

const authStore = useAuthStore();
const eventBus = useEventBus();
const earlyAccessStore = useEarlyAccessStore();
const intercom = useIntercom();
const earlyAccessExempt = useEarlyAccessExempt();

const { confirmed: confirmedEarlyAccess } = storeToRefs(earlyAccessStore);

const showConfirmEarlyAccess = computed(() => {
  return !earlyAccessExempt.value && !confirmedEarlyAccess.value;
});

onMounted(async () => {
  if (authStore.tokens) {
    await authStore.loadCurrentUser();
  }

  eventBus.$on('user-loaded', async () => {
    await initIntercom();
  });

  await initIntercom();
});

onUpdated(async () => {
  await initIntercom();
});

async function initIntercom() {
  await intercom.boot({
    app_id: import.meta.env.VITE_INTERCOM_APP_TOKEN as string,
    user_id: authStore.user?.id,
    name: authStore.user?.email,
    email: authStore.user?.email,
    created_at: authStore.user?.createdAt,
  } as any);
}

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

async function confirmEarlyAccessTerms() {
  try {
    await patchCurrentUser({ confirmEarlyAccessStart: true });
    earlyAccessStore.confirm();
  } catch (err) {
    showError({ message: 'Failed to start early access!' });
  }
}
</script>

<template>
  <div class="block h-screen bg-surface-2 text-white md:flex">
    <Navbar v-if="!!authStore.tokens" class="w-full md:max-w-[300px]" />
    <div class="block w-full">
      <div
        v-if="!!authStore.tokens"
        class="justify-end bg-surface-2 h-[5rem] hidden md:flex"
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

  <ModalAlternate :show="showCreateCampaign" extra-dark>
    <div class="md:w-[800px] p-6 bg-neutral-900 rounded-md">
      <NewCampaign />
    </div>
  </ModalAlternate>

  <ModalAlternate :show="!!authStore.tokens && showConfirmEarlyAccess">
    <div
      class="md:w-[1000px] max-h-[90vh] p-6 bg-neutral-900 rounded-[20px] overflow-y-auto text-white text-center"
    >
      <div class="text-4xl">🐉 Welcome to MythWeaver! 🎲</div>

      <div class="mt-4 text-xl text-neutral-400">
        You've just unlocked
        <span class="font-bold">Trial Access</span>!
      </div>

      <div class="text-xl mt-8 mb-2">⏳ 48-Hour Access ⌛</div>
      <div class="text-lg text-neutral-400">
        Yup, you read it right. You've got 48 hours of unrestricted journeying
        within MythWeaver. Consider this your mini-adventure before the main
        campaign.
      </div>

      <div class="text-xl mt-6 mb-2">🚀 Early Access 🚀</div>
      <div class="text-lg text-neutral-400">
        After your 48-hour access, you'll need to back our Kickstarter at Adept
        tier or higher to continue your adventure, until our public launch in
        January.

        <div class="my-6 mb-10">
          <a
            href="https://mythweaver.backerkit.com/hosted_preorders"
            target="_blank"
            class="bg-neutral-700 text-white rounded-md px-4 py-2 transition-all hover:scale-110"
            >Pre-Order Now</a
          >
        </div>
      </div>

      <div class="text-3xl mt-6 mb-2">❓ FAQ ❓</div>
      <div class="text-lg text-neutral-400">
        <ul>
          <li>
            <div class="font-bold text-neutral-300">
              What happens to my data if my trial access expires?
            </div>
            Your data will be saved, but you won't be able to access it until
            either you pre-order MythWeaver or we launch MythWeaver to the
            public (planned for January 2024).
          </li>
          <li class="mt-4">
            <div class="font-bold text-neutral-300">
              Does early access consume any of my purchased subscription period?
            </div>
            No! Early access is a free bonus perk to for pre-order purchasers.
          </li>
        </ul>
      </div>

      <button
        class="flex justify-center mt-6 mx-auto w-[50%] self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
        @click="confirmEarlyAccessTerms"
      >
        <SparklesIcon class="mr-2 h-5 w-5 self-center" />
        <span class="self-center">Start 48 hour trial!</span>
      </button>
    </div>
  </ModalAlternate>

  <ModalAlternate :show="showCustomizeImageModal" extra-dark>
    <div
      class="md:w-[800px] p-2 md:p-6 md:px-12 bg-neutral-900 rounded-[20px] text-white text-center"
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
