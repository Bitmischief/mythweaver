<script lang="ts" setup>
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { UpgradeRequest, useCurrentUserPlan } from '@/lib/hooks.ts';
import { getBillingPortalUrl, getCheckoutUrl } from '@/api/billing.ts';
import { BillingPlan } from '@/api/users.ts';

const eventBus = useEventBus();
const currentUserPlan = useCurrentUserPlan();
const showUpgradeModal = ref(false);
const upgradeRequest = ref<UpgradeRequest | null>(null);

onMounted(() => {
  eventBus.$on('request-upgrade', async (request: UpgradeRequest) => {
    upgradeRequest.value = request;
    showUpgradeModal.value = true;
  });
});

onUnmounted(() => {
  eventBus.$off('user-loaded');
});

async function clickUpgradeNow() {
  const requiredPriceId =
    upgradeRequest.value?.requiredPlan === BillingPlan.Pro
      ? import.meta.env.VITE_STRIPE_PRO_PLAN_ID
      : import.meta.env.VITE_STRIPE_BASIC_PLAN_ID;

  if (currentUserPlan.value === BillingPlan.Free) {
    const response = await getCheckoutUrl(requiredPriceId, true);

    location.href = response.data;
  } else {
    const response = await getBillingPortalUrl({
      upgrade: true,
      newPlanPriceId: requiredPriceId,
      redirectUri: upgradeRequest.value?.redirectUri,
    });

    location.href = response.data;
  }
}
</script>

<template>
  <ModalAlternate
    :show="showUpgradeModal"
    extra-dark
    @close="showUpgradeModal = false"
  >
    <div
      v-if="upgradeRequest"
      class="md:w-[800px] p-6 bg-surface-2 rounded-[20px] border border-surface-3"
    >
      <div class="flex justify-between text-neutral-300">
        <div class="text-lg mb-6">Upgrade Required</div>
        <XCircleIcon
          class="h-6 w-6 cursor-pointer"
          @click="showUpgradeModal = false"
        />
      </div>

      <div class="text-2xl text-neutral-300 mb-6">
        You need to upgrade your subscription to
        <span class="text-green-400">{{ upgradeRequest.requiredPlan }}</span> to
        <span class="text-fuchsia-500">{{ upgradeRequest.feature }}</span
        >.
      </div>

      <button
        class="button-gradient font-bold text-white text-center"
        @click="clickUpgradeNow"
      >
        Upgrade Now
      </button>
    </div>
  </ModalAlternate>
</template>
