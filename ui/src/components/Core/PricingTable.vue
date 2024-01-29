<script lang="ts" setup>
import PricingPlan from '@/components/Core/PricingPlan.vue';
import { computed } from 'vue';

const basicPlanId = computed(() => import.meta.env.VITE_STRIPE_BASIC_PLAN_ID);
const proPlanId = computed(() => import.meta.env.VITE_STRIPE_PRO_PLAN_ID);
</script>

<template>
  <div class="p-6">
    <div class="grid grid-cols-2 gap-4">
      <PricingPlan
        name="Basic"
        :yearly-price="50"
        :features="[
          'Create Conjurations',
          'Advanced Character Attribute Generation',
          'Image Generation (75 images/mo)',
          'Join Existing Campaigns',
          'Take Notes',
          'Manage Inventory',
        ]"
        :plan-id="basicPlanId"
      />
      <PricingPlan
        name="Pro"
        highlighted
        :yearly-price="150"
        :features="[
          'All Basic features PLUS',
          'Session Recording & Transcripts',
          'AI Generated Dungeon Maps',
          'Priority Support',
        ]"
        :plan-id="proPlanId"
      />
    </div>
  </div>
</template>
