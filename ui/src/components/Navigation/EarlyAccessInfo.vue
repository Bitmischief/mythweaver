<script lang="ts" setup>
import { useEarlyAccessCutoff, useEarlyAccessExempt } from '@/lib/hooks.ts';
import { computed } from 'vue';
import { formatDistance } from 'date-fns';
import { BoltIcon } from '@heroicons/vue/20/solid';

const earlyAccessCutoff = useEarlyAccessCutoff();
const earlyAccessExempt = useEarlyAccessExempt();
const earlyAccessDistance = computed(() =>
  earlyAccessCutoff.value
    ? formatDistance(new Date(), new Date(earlyAccessCutoff.value))
    : '',
);
</script>

<template>
  <div v-if="!earlyAccessExempt" class="flex justify-center">
    <div class="self-center flex md:mr-6 text-sm text-neutral-400">
      <div class="self-center">
        Trial ends in
        <span class="text-neutral-300 font-bold italic">{{
          earlyAccessDistance
        }}</span>
      </div>

      <a
        href="https://mythweaver.backerkit.com/hosted_preorders"
        target="_blank"
        class="ml-2 self-center text-sm flex text-neutral-800 font-bold text-center px-3 p-1 rounded-md bg-amber-400"
      >
        <BoltIcon class="w-4 h-4 mr-1 self-center" />
        <span class="self-center">Upgrade</span>
      </a>
    </div>
  </div>
</template>
