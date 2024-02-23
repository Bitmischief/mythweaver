<script lang="ts" setup>
import PricingPlan from '@/components/Core/PricingPlan.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/store';

const authStore = useAuthStore();

const currentPlan = computed(() => {
  if (!authStore.user) {
    return;
  }

  return authStore.user.plan;
});

const basicPlanId = computed(() => import.meta.env.VITE_STRIPE_BASIC_PLAN_ID);
const proPlanId = computed(() => import.meta.env.VITE_STRIPE_PRO_PLAN_ID);
</script>

<template>
  <div class="p-2">
    <div class="grid md:grid-cols-2 gap-4">
      <PricingPlan
        name="Basic"
        :monthly-price="5.0"
        :yearly-price="50"
        :features="[
          '100 images/mo',
          '(soon) Image Upscaling',
          '(soon) Image Modifications',
          'Private Conjurations',
          'Campaign Management',
          'Session AI summaries',
          'Player character creation and management',
        ]"
        :price-id="basicPlanId"
        :current="currentPlan === 'BASIC'"
      />
      <PricingPlan
        name="Pro"
        highlighted
        :monthly-price="15.0"
        :yearly-price="150"
        :features="[
          '300 images/mo',
          'All Basic features PLUS',
          'Session Audio Recordings',
          'Session Audio Transcripts',
          'Commercial Usage Rights',
          '(soon) Advanced Conjuration Types',
          '(soon) World Management',
          'Priority Support',
        ]"
        :price-id="proPlanId"
        :current="currentPlan === 'PRO'"
      />
    </div>
    <div class="flex justify-end text-xs text-neutral-500 mt-4">
      * prices shown are in USD
    </div>
  </div>
</template>
