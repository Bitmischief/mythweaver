<script lang="ts" setup>
import { useEventBus } from '@/lib/events.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { XCircleIcon } from '@heroicons/vue/24/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { UpgradeRequest } from '@/lib/hooks.ts';

const eventBus = useEventBus();
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
        {{ upgradeRequest.requiredPlan }} to
        <span class="text-fuchsia-500">{{ upgradeRequest.feature }}</span
        >.
      </div>

      <div class="button-gradient font-bold text-white text-center">
        Upgrade Now
      </div>
    </div>
  </ModalAlternate>
</template>
