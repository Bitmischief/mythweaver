<script lang="ts" setup>
import { useWebsocketChannel } from '@/lib/hooks.ts';
import { computed, onMounted } from 'vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useAuthStore } from '@/store';
import { ref } from 'vue';

const channel = useWebsocketChannel();
const authStore = useAuthStore();
const earlyAccessExempt = computed(() => authStore.user?.earlyAccessExempt);

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
</script>

<template>
  <div
    class="flex items-center border border-zinc-800 bg-surface-3 rounded-[25px] p-1"
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

    <div v-if="!collapsed" class="text-neutral-400 mx-2">generations left</div>
  </div>
</template>
