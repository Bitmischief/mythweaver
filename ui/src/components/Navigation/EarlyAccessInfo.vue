<script lang="ts" setup>
import { useEarlyAccessCutoff, useEarlyAccessExempt } from '@/lib/hooks.ts';
import { computed, ref } from 'vue';
import { formatDistance } from 'date-fns';
import { BoltIcon } from '@heroicons/vue/20/solid';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import PricingTable from '@/components/Core/PricingTable.vue';
import { useAuthStore } from '@/store';

const authStore = useAuthStore();
const earlyAccessCutoff = useEarlyAccessCutoff();
const earlyAccessExempt = useEarlyAccessExempt();

const showUpgradeModal = ref(false);
const earlyAccessDistance = computed(() =>
  earlyAccessCutoff.value
    ? formatDistance(new Date(), new Date(earlyAccessCutoff.value))
    : '',
);
</script>

<template>
  <div v-if="!earlyAccessExempt && authStore.user" class="flex justify-center">
    <div class="self-center flex md:mr-6 text-sm text-neutral-400">
      <div class="self-center">
        Trial ends in
        <span class="text-neutral-300 font-bold italic">{{
          earlyAccessDistance
        }}</span>
      </div>

      <button
        class="ml-2 self-center text-sm flex text-neutral-800 font-bold text-center px-3 p-1 rounded-md bg-amber-400"
        @click="showUpgradeModal = true"
      >
        <BoltIcon class="w-4 h-4 mr-1 self-center" />
        <span class="self-center">Upgrade</span>
      </button>
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
