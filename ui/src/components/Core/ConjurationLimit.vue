<script setup lang="ts">
import { useAuthStore } from '@/store';
import { computed, onMounted, ref } from 'vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import PricingTable from '@/components/Core/PricingTable.vue';
import { BillingPlan } from '@/api/users.ts';
import { useLDFlag } from 'launchdarkly-vue-client-sdk';
import { FreeTierConjurationLimit } from '@/lib/consts.ts';

const channel = useWebsocketChannel();
const authStore = useAuthStore();
const showConjurationLimit = useLDFlag('free-tier-conjuration-limit', false);

const earlyAccessExempt = computed(() => authStore.user?.earlyAccessExempt);

defineProps<{
  collapsed?: boolean;
}>();

onMounted(() => {
  channel.bind(
    ServerEvent.UserConjurationCountUpdated,
    (newConjurationCount: number) => {
      conjurationCountChanged(newConjurationCount);
    },
  );
});

const conjurationsIncreasing = ref(false);
const showUpgradeModal = ref(false);

function conjurationCountChanged(newConjurationCount: number) {
  conjurationsIncreasing.value = true;

  if (!authStore.user) return;
  authStore.user.conjurationCount = newConjurationCount;

  setTimeout(() => {
    conjurationsIncreasing.value = false;
  }, 500);
}

const conjurationCount = computed(() => {
  return authStore.user?.conjurationCount || null;
});
const conjurationLimitMet = computed(() => {
  return (
    conjurationCount.value && conjurationCount.value >= FreeTierConjurationLimit
  );
});
const showConjurationCount = computed(() => {
  return authStore.user && authStore.user.plan === BillingPlan.Free;
});
</script>

<template>
  <div
    v-if="showConjurationLimit && showConjurationCount"
    class="flex items-center border border-zinc-800 bg-surface-3 rounded-[25px] p-1 cursor-pointer"
    @click="showUpgradeModal = true"
  >
    <div class="relative min-w-[3em] min-h-[2em]">
      <div
        class="bg-fuchsia-500/75 rounded-full absolute h-full w-full"
        :class="{ 'animate-ping duration-500': conjurationsIncreasing }"
      ></div>
      <div
        class="relative h-[2em] bg-surface rounded-full p-1 text-center text-neutral-400 font-bold px-2 overflow-hidden"
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
              conjurationsIncreasing,
            'text-amber-400': conjurationLimitMet,
          }"
        >
          <div>{{ conjurationCount }}/{{ FreeTierConjurationLimit }}</div>
          <div>{{ conjurationCount }}/{{ FreeTierConjurationLimit }}</div>
        </div>
      </div>
    </div>

    <div v-if="!collapsed" class="text-neutral-400 mx-2">conjurations</div>
  </div>

  <ModalAlternate
    :show="showUpgradeModal"
    extra-dark
    @close="showUpgradeModal = false"
  >
    <div
      class="w-[90vw] md:w-[70vw] xl:w-[60vw] p-6 bg-surface-2 rounded-[20px] border border-surface-3"
    >
      <div class="flex gap-4 justify-between text-neutral-300">
        <div class="text-xl mb-6">
          Upgrade Your Subscription To Add More Conjurations
        </div>
        <XCircleIcon
          class="h-6 w-6 cursor-pointer"
          @click="showUpgradeModal = false"
        />
      </div>

      <PricingTable />
    </div>
  </ModalAlternate>
</template>

<style scoped></style>
