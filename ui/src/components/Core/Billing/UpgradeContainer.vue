<script lang="ts" setup>
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { UpgradeRequest, useCurrentUserPlan } from '@/lib/hooks.ts';
import { getBillingPortalUrl, getCheckoutUrl } from '@/api/billing.ts';
import { BillingPlan } from '@/api/users.ts';
import PlanBadge from '@/components/Core/PlanBadge.vue';

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
      class="md:w-[800px] bg-surface-2 rounded-[20px] border border-surface-3"
    >
      <div
        class="bg-[url('/images/upgrade-container-illustration.svg')] bg-center bg-cover rounded-t-2xl h-52"
      >
        <div class="flex justify-center items-center h-full">
          <div>
            <img src="/images/upgrade-icon.svg" alt="Upgrade" class="mx-auto" />

            <div class="flex mt-4">
              <img
                src="/images/logo-horizontal-2.svg"
                class="h-14 w-auto mr-auto mt-1 mb-1 self-center"
              />
              <PlanBadge :plan-override="upgradeRequest.requiredPlan" />
            </div>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="flex justify-center text-neutral-300">
          <div class="text-3xl font-bold text-white mb-6">Upgrade Required</div>
        </div>

        <div class="text-2xl text-center mx-12 text-neutral-400 mb-6">
          You need to upgrade your subscription to
          {{ upgradeRequest.requiredPlan }} to
          <span
            class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E5AD59] to-[#E95252]"
            >{{ upgradeRequest.feature }}</span
          >.
        </div>

        <div class="mt-16 w-full grid md:grid-cols-2 gap-4">
          <button
            class="button-primary h-16 text-xl text-white text-center"
            @click="showUpgradeModal = false"
          >
            Cancel
          </button>

          <button
            class="button-gradient h-16 text-xl text-white text-center"
            @click="clickUpgradeNow"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>
