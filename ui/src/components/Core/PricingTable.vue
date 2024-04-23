<script lang="ts" setup>
import PricingPlan from '@/components/Core/PricingPlan.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/store';
import { BillingPlan } from '@/api/users.ts';

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
    <div class="grid md:grid-cols-3 gap-4">
      <PricingPlan
        name="Free"
        :monthly-price="0"
        :yearly-price="0"
        :features="[
          'View Campaigns',
          'View Sessions',
          'Player character creation and management',
        ]"
        :current="
          currentPlan === BillingPlan.Free || currentPlan === BillingPlan.Trial
        "
      />
      <PricingPlan
        name="Basic"
        highlighted
        :monthly-price="5.0"
        :yearly-price="50"
        :features="[
          'Unlimited saved conjurations',
          '100 images/mo',
          'Image Upscaling',
          'Image Modifications',
          'Private Conjurations',
          'Campaign Management',
        ]"
        :price-id="basicPlanId"
        :current="currentPlan === BillingPlan.Basic"
      />
      <PricingPlan
        name="Pro"
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
        :current="currentPlan === BillingPlan.Pro"
      />
    </div>
    <div class="flex justify-end text-xs text-neutral-500 mt-4">
      * prices shown are in USD
    </div>
  </div>
</template>
