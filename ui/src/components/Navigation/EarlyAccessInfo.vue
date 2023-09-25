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
      Early access ends in
      <span class="text-neutral-300 font-bold italic">{{
        earlyAccessDistance
      }}</span>

      <a
        href="https://mythweaver.co/earlyaccess"
        target="_blank"
        class="ml-2 text-xs text-neutral-300 text-center px-2 p-0.5 rounded-md bg-neutral-600"
      >
        extend
      </a>
    </div>
  </div>
</template>
