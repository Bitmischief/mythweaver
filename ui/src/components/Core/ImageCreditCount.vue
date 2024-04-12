<script lang="ts" setup>
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { computed, onMounted, ref } from 'vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useAuthStore } from '@/store';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import PricingPlan from '@/components/Core/PricingPlan.vue';
import PricingTable from '@/components/Core/PricingTable.vue';
import { BillingPlan } from '@/api/users.ts';

const channel = useWebsocketChannel();
const authStore = useAuthStore();

const earlyAccessExempt = computed(() => authStore.user?.earlyAccessExempt);
const imageCredit100PackPriceId = computed(
  () => import.meta.env.VITE_STRIPE_100_IMAGE_CREDITS_ID,
);
const showBuyImageCreditsModal = ref(false);
const currentPlan = computed(() => {
  if (!authStore.user) {
    return;
  }

  return authStore.user.plan;
});

defineProps<{
  collapsed?: boolean;
}>();

onMounted(() => {
  channel.bind(
    ServerEvent.UserImageCreditCountUpdated,
    (newImageCreditCount: number) => {
      creditCountChanged(newImageCreditCount);
    },
  );
});

const creditsReducing = ref(false);

function creditCountChanged(newImageCreditCount: number) {
  creditsReducing.value = true;

  if (!authStore.user) return;
  authStore.user.imageCredits = newImageCreditCount;

  setTimeout(() => {
    creditsReducing.value = false;
  }, 500);
}

const credits = computed(() => {
  return authStore.user?.imageCredits || '0';
});

const clickCreditCount = () => {
  if (authStore.user && !authStore.user.earlyAccessExempt) {
    showBuyImageCreditsModal.value = true;
  }
};
</script>

<template>
  <div
    class="flex items-center border border-zinc-800 bg-surface-3 rounded-[25px] p-1 cursor-pointer"
    @click="clickCreditCount"
  >
    <div class="relative min-w-[3em] min-h-[2em]">
      <div
        class="bg-fuchsia-500/75 rounded-full absolute h-full w-full"
        :class="{ 'animate-ping duration-500': creditsReducing }"
      ></div>
      <div
        class="relative h-[2em] bg-surface rounded-full p-1 text-center text-fuchsia-500 font-bold px-2 overflow-hidden"
      >
        <img
          v-if="earlyAccessExempt"
          src="@/assets/icons/infinity.png"
          alt="infinity"
          class="h-full mx-auto pb-[2px]"
        />
        <div
          v-else
          :class="{
            '-translate-y-6 duration-500 ease-out transition-transform':
              creditsReducing,
          }"
        >
          <div>{{ credits }}</div>
          <div>{{ credits }}</div>
        </div>
      </div>
    </div>

    <div v-if="!collapsed" class="text-neutral-400 mx-2">image credits</div>
  </div>

  <ModalAlternate
    :show="showBuyImageCreditsModal"
    extra-dark
    @close="showBuyImageCreditsModal = false"
  >
    <div
      class="w-[90vw] md:w-[70vw] xl:w-[60vw] p-6 bg-surface-2 rounded-[20px] border border-surface-3 mt-4"
    >
      <div class="flex gap-4 justify-between text-neutral-300">
        <div class="text-xl mb-6">Buy More Image Credits</div>
        <XCircleIcon
          class="h-6 w-6 cursor-pointer"
          @click="showBuyImageCreditsModal = false"
        />
      </div>

      <template
        v-if="
          currentPlan === BillingPlan.Trial || currentPlan === BillingPlan.Free
        "
      >
        <div class="flex justify-between mb-2">
          <div class="grow m-3"><hr class="border-1 border-neutral-500" /></div>
          <div class="self-center">Subscribe</div>
          <div class="grow m-3">
            <hr class="border-1 border-neutral-500 self-center" />
          </div>
        </div>

        <PricingTable />

        <div class="flex justify-between">
          <div class="grow m-3"><hr class="border-1 border-neutral-500" /></div>
          <div class="self-center">or</div>
          <div class="grow m-3">
            <hr class="border-1 border-neutral-500 self-center" />
          </div>
        </div>
      </template>

      <PricingPlan
        name="100 Image Credit Pack"
        :price="5"
        :features="['Generate 100 more images', 'No subscription required']"
        :price-id="imageCredit100PackPriceId"
      />
    </div>
  </ModalAlternate>
</template>
