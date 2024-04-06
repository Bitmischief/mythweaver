<script lang="ts" setup>
import {
  useCurrentUserPlan,
  useTrialEndsAt,
  useEarlyAccessExempt,
} from '@/lib/hooks.ts';
import { ref } from 'vue';
import { formatDistance } from 'date-fns';
import { BoltIcon } from '@heroicons/vue/20/solid';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import PricingTable from '@/components/Core/PricingTable.vue';
import { BillingPlan } from '@/api/users.ts';

const trialEndsAt = useTrialEndsAt();
const plan = useCurrentUserPlan();

const showUpgradeModal = ref(false);

const earlyAccessEnds = () => {
  if (trialEndsAt.value) {
    const cutoff = new Date(trialEndsAt.value);
    const now = new Date();

    return trialEndsAt.value
      ? `Trial ends in ${formatDistance(now, cutoff)}`
      : '';
  }
};
</script>

<template>
  <div v-if="plan === BillingPlan.Trial" class="flex justify-center">
    <div class="self-center flex md:mr-6 text-sm text-neutral-400">
      <div class="self-center">
        <span class="text-neutral-300 font-bold italic">
          {{ earlyAccessEnds() }}
        </span>
      </div>

      <div
        class="relative cursor-pointer group"
        @click="showUpgradeModal = true"
      >
        <button
          class="ml-2 self-center text-sm flex text-neutral-800 font-bold text-center px-3 p-1 rounded-md bg-amber-400"
        >
          <BoltIcon class="w-4 h-4 mr-1 self-center" />
          <span class="self-center">Upgrade</span>
        </button>
      </div>
    </div>

    <ModalAlternate
      :show="showUpgradeModal"
      extra-dark
      @close="showUpgradeModal = false"
    >
      <div
        class="md:w-[800px] p-6 bg-surface-2 rounded-[20px] border border-surface-3"
      >
        <div class="flex justify-between text-neutral-300">
          <div class="text-xl mb-6">Upgrade Subscription</div>
          <XCircleIcon
            class="h-6 w-6 cursor-pointer"
            @click="showUpgradeModal = false"
          />
        </div>

        <PricingTable />
      </div>
    </ModalAlternate>
  </div>
</template>
