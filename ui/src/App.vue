<script setup lang="ts">
import Navbar from '@/components/Navigation/NavBar.vue';
import { useAuthStore } from '@/store';
import NotificationHandler from '@/components/Notifications/NotificationHandler.vue';
import { useEventBus } from '@/lib/events.ts';
import { computed, onMounted, onUpdated, ref } from 'vue';
import NavBarHeader from '@/components/Navigation/NavBarHeader.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import LightboxRoot from '@/components/LightboxRoot.vue';
import { useEarlyAccessStore } from '@/store/earlyAccess.store.ts';
import { storeToRefs } from 'pinia';
import { SparklesIcon } from '@heroicons/vue/20/solid';
import CustomizeConjurationImage from '@/components/Conjuration/ViewConjuration/CustomizeConjurationImage.vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import { patchCurrentUser } from '@/api/users.ts';
import { showError } from '@/lib/notifications.ts';
import { useEarlyAccessExempt } from '@/lib/hooks.ts';
import Loader from './components/Core/Loader.vue';
import Accordion from './components/Core/Accordion.vue';

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
          height: `${!!authStore.tokens ? 'calc(100vh - 4rem)' : 'auto'}`,
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

  <ModalAlternate
    :show="
      !authStore.isLoading &&
      !showLoading &&
      !!authStore.tokens &&
      showConfirmEarlyAccess
    "
  >
    <div
      class="bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px]"
    >
      <div
        class="md:w-[1000px] max-h-[90vh] bg-surface p-6 rounded-[20px] overflow-y-auto text-white text-center"
      >
        <span
          class="text-4xl bg-clip-text font-bold text-transparent bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-400 via-violet-500"
        >
          Welcome to MythWeaver!
        </span>

        <div class="text-xl mt-8 mb-2">You have 48-Hours of Access</div>
        <div class="text-lg text-neutral-400">
          Yup, you read it right. You've got 48 hours of unrestricted journeying
          within MythWeaver. Consider this your mini-adventure before the main
          campaign.
        </div>

        <div class="grid grid-cols-2 gap-8 my-8">
          <div class="rounded-[20px] border border-white">
            <Accordion title="What happens after my 48-hour trial?">
              <div class="text-neutral-400 p-6">
                After your 48-hour access ends, you'll need to back our
                Kickstarter at Adept tier or higher to continue your adventure,
                until our public launch.

                <div class="my-6 mb-10">
                  <a
                    href="https://mythweaver.backerkit.com/hosted_preorders"
                    target="_blank"
                    class="button-gradient text-white"
                    >Pre-Order Now</a
                  >
                </div>
              </div>
            </Accordion>
          </div>
          <div class="rounded-[20px] border border-white">
            <Accordion title="FAQs">
              <div class="text-lg text-neutral-400 p-6">
                <ul class="text-left">
                  <li>
                    <div class="font-bold text-neutral-300">
                      1. What happens to my data if my trial access expires?
                    </div>
                    <div class="text-neutral-500">
                      Your data will be saved, but you won't be able to access
                      it until either you pre-order MythWeaver or we launch
                      MythWeaver to the public (planned for January 2024).
                    </div>
                  </li>
                  <li class="mt-4">
                    <div class="font-bold text-neutral-300">
                      2. Does early access consume any of my purchased
                      subscription period?
                    </div>
                    <div class="text-neutral-500">
                      No! Early access is a free bonus perk to for pre-order
                      purchasers.
                    </div>
                  </li>
                </ul>
              </div>
            </Accordion>
          </div>
        </div>

        <button
          class="flex button-gradient w-full justify-around"
          @click="confirmEarlyAccessTerms"
        >
          <div class="flex">
            <SparklesIcon class="mr-2 h-5 w-5 self-center" />
            <span class="self-center">Start 48-hour trial!</span>
          </div>
        </button>
      </div>
    </div>
  </ModalAlternate>

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
