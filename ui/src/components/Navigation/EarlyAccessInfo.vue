<script lang="ts" setup>
import { useEarlyAccessCutoff, useEarlyAccessExempt } from '@/lib/hooks.ts';
import { computed } from 'vue';
import { formatDistance } from 'date-fns';

const earlyAccessCutoff = useEarlyAccessCutoff();
const earlyAccessExempt = useEarlyAccessExempt();
const earlyAccessDistance = computed(() =>
  earlyAccessCutoff.value
    ? formatDistance(new Date(), new Date(earlyAccessCutoff.value))
    : '',
);
</script>

<template>
  <div v-if="!earlyAccessExempt">
    <div class="self-center mr-6 text-sm text-neutral-400">
      Trial access ends in
      <span class="text-neutral-300 font-bold italic">{{
        earlyAccessDistance
      }}</span>

      <a
        href="
https://www.kickstarter.com/projects/mythweaver/mythweaver-ai-dungeon-master-assistant?ref=3glebk"
        target="_blank"
        class="ml-2 text-xs text-white text-center px-3 p-1 rounded-md bg-green-500"
      >
        Purchase Early Access
      </a>
    </div>
  </div>
</template>
