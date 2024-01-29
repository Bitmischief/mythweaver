<script lang="ts" setup>
import { getCheckoutUrl } from '@/api/billing.ts';

const props = defineProps<{
  name: string;
  yearlyPrice: number;
  highlighted?: boolean;
  features: string[];
  planId: string;
}>();

async function upgrade() {
  const response = await getCheckoutUrl(props.planId);
  location.href = response.data;
}
</script>

<template>
  <div
    class="border rounded-md p-4 flex flex-col justify-between"
    :class="highlighted ? 'border-fuchsia-500 border-4' : 'border-fuchsia-900'"
  >
    <div>
      <div class="text-2xl">{{ name }}</div>
      <div class="text-lg text-neutral-300">
        ${{ (yearlyPrice / 12).toFixed(2) }}/mo
        <span class="text-neutral-500">(when payed yearly)</span>
      </div>
      <div class="">
        <ul class="mt-4 text-neutral-300 list-disc list-inside">
          <li v-for="feature of features" :key="feature">{{ feature }}</li>
        </ul>
      </div>
    </div>

    <div class="mt-8">
      <button class="w-full bg-green-500 rounded-md px-3 py-2" @click="upgrade">
        Upgrade Now
      </button>
    </div>
  </div>
</template>
