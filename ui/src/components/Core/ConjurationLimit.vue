<script setup lang="ts">
import { useAuthStore } from '@/store';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { FreeTierConjurationLimit } from '@/lib/consts.ts';
import { useEventBus } from '@/lib/events.ts';

const channel = useWebsocketChannel();
const authStore = useAuthStore();
const eventBus = useEventBus();

const earlyAccessExempt = computed(() => authStore.user?.earlyAccessExempt);

defineProps<{
  collapsed?: boolean;
}>();

onMounted(() => {
  channel.bind(
    ServerEvent.UserConjurationCountUpdated,
    userConjurationCountUpdatedHandler,
  );
});

function userConjurationCountUpdatedHandler(newConjurationCount: number) {
  conjurationCountChanged(newConjurationCount);
}

onUnmounted(() => {
  channel.unbind(
    ServerEvent.UserConjurationCountUpdated,
    userConjurationCountUpdatedHandler,
  );
});

const conjurationsIncreasing = ref(false);

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
  // This may get added back in the future
  // return authStore.user && authStore.user.plan === BillingPlan.Free;
  return false;
});
</script>

<template>
  <div
    v-if="showConjurationCount"
    class="flex items-center border border-zinc-800 bg-surface-3 rounded-[25px] p-1 cursor-pointer"
    @click="eventBus.$emit('show-subscription-modal')"
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
</template>

<style scoped></style>
