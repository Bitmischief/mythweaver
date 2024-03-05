<script lang="ts" setup>
import {
  useEarlyAccessCutoff,
  useEarlyAccessExempt,
  useSubscriptionPaidThrough,
} from '@/lib/hooks.ts';
import { ref, watch } from 'vue';
import { formatDistance } from 'date-fns';
import { BoltIcon } from '@heroicons/vue/20/solid';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import PricingTable from '@/components/Core/PricingTable.vue';
import { useAuthStore } from '@/store';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();
const earlyAccessCutoff = useEarlyAccessCutoff();
const earlyAccessExempt = useEarlyAccessExempt();
const subscriptionPaidThrough = useSubscriptionPaidThrough();

const showUpgradeModal = ref(false);

watch(subscriptionPaidThrough, () => {
  if (
    subscriptionPaidThrough.value &&
    new Date(subscriptionPaidThrough.value) < new Date()
  ) {
    router.push('/auth/earlyaccess');
  }
});

const earlyAccessEnds = () => {
  if (earlyAccessCutoff.value) {
    const cutoff = new Date(earlyAccessCutoff.value);
    const now = new Date();

    if (cutoff < now) {
      router.push('/auth/earlyaccess');
      return 'Trial has ended';
    }

    return earlyAccessCutoff.value
      ? `Trial ends in ${formatDistance(now, cutoff)}`
      : '';
  }
};
</script>

<template>
  <div v-if="!earlyAccessExempt && authStore.user" class="flex justify-center">
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

        <div
          class="h-4 w-4 bg-green-400 border border-green-200 group-hover:animate-bounce absolute -top-1 -right-1 rounded-full"
        ></div>
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

        <div class="mb-6 bg-slate-900 text-green-300 p-4 rounded-md">
          <div class="text-4xl">Save 40% for the next 6 months</div>
          <div class="text-xl font-bold text-neutral-500">This March only</div>
        </div>

        <PricingTable />
      </div>
    </ModalAlternate>
  </div>
</template>
