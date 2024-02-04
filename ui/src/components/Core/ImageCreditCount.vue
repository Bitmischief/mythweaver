<script lang="ts" setup>
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { computed, onMounted } from 'vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useAuthStore } from '@/store';

const channel = useWebsocketChannel();
const authStore = useAuthStore();
const earlyAccessExempt = computed(() => authStore.user?.earlyAccessExempt);

onMounted(() => {
  channel.bind(
    ServerEvent.UserImageCreditCountUpdated,
    (newImageCreditCount: number) => {
      if (!authStore.user) return;
      authStore.user.imageCredits = newImageCreditCount;
    },
  );
});

const credits = computed(() => {
  return authStore.user?.imageCredits || '0';
});
</script>

<template>
  <div
    class="flex items-center cursor-pointer border border-zinc-800 bg-surface-3 rounded-[25px] py-1 px-2"
  >
    <div
      class="bg-surface rounded-full p-1 mr-2 min-w-[2em] text-center text-fuchsia-500 font-bold px-2"
    >
      {{ earlyAccessExempt ? 'unlimited' : credits }}
    </div>
    <div class="text-neutral-400 mr-2">generations left</div>
  </div>
</template>
