<script lang="ts" setup>
import { getCheckoutUrl } from '@/api/billing.ts';
import { CheckIcon } from '@heroicons/vue/24/solid';
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  price?: number;
  yearlyPrice?: number;
  monthlyPrice?: number;
  highlighted?: boolean;
  features: string[];
  priceId: string;
  current?: boolean;
}>();

async function upgrade() {
  const response = await getCheckoutUrl(
    props.priceId,
    !!props.monthlyPrice && !!props.yearlyPrice,
  );
  location.href = response.data;
}

const proPlanId = computed(() => {
  return import.meta.env.VITE_STRIPE_PRO_PLAN_ID;
});
</script>

<template>
  <div
    class="flex flex-col rounded-[12px]"
    :class="{
      'bg-fuchsia-500 p-px': highlighted,
      'mt-[1.5em]': !highlighted,
    }"
  >
    <div v-if="highlighted" class="text-center pt-1 text-xs h-[1.5rem]">
      Most Popular
    </div>
    <div
      class="border rounded-[12px] h-full p-4 bg-surface-3 flex flex-col justify-between border-none"
    >
      <div>
        <div
          class="rounded-[12px] bg-surface-2 p-4"
          :class="{
            'bg-gradient': props.priceId === proPlanId,
          }"
        >
          <div class="text-sm text-neutral-300">{{ name }}</div>
          <div
            v-if="monthlyPrice && yearlyPrice"
            class="text-3xl text-white font-bold"
          >
            <div v-if="monthlyPrice > 0">
              <div>${{ monthlyPrice.toFixed(2) }}/mo</div>
              <div v-if="yearlyPrice" class="text-sm text-neutral-200">
                <span class="line-through text-neutral-300">
                  ${{ (monthlyPrice * 12).toFixed(2) }}
                </span>
                ${{ yearlyPrice.toFixed(2) }}/yearly
              </div>
            </div>
            <div v-else>
              Free Forever
              <div class="text-sm opacity-0">
                ${{ (monthlyPrice * 12).toFixed(2) }}
              </div>
            </div>
          </div>
          <div v-else-if="price" class="text-xl text-white font-bold">
            <div>${{ price.toFixed(2) }}</div>
          </div>
        </div>

        <ul class="mt-4 text-neutral-400 list-none text-md">
          <li v-for="feature of features" :key="feature" class="flex">
            <CheckIcon class="h-4 mr-1" /> {{ feature }}
          </li>
        </ul>
      </div>
      <div class="mt-8">
        <div v-if="monthlyPrice || yearlyPrice">
          <button
            v-if="current"
            class="button-secondary w-full rounded-full flex text-neutral-500 hover:cursor-not-allowed"
          >
            <CheckIcon class="h-4 mr-1" />
            Current Subscription
          </button>
          <button
            v-else
            class="button-white rounded-full w-full"
            @click="upgrade"
          >
            Upgrade Now
          </button>
        </div>
        <button
          v-else
          class="button-gradient rounded-full w-full"
          @click="upgrade"
        >
          Buy Now
        </button>
      </div>
    </div>
  </div>
</template>
