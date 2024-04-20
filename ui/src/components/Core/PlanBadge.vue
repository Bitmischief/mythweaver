<script setup lang="ts">
import { useAuthStore } from '@/store';
import { computed } from 'vue';
import { BillingPlan } from '@/api/users.ts';
import { useEventBus } from '@/lib/events.ts';

defineEmits(['show-subscription-modal']);

const eventBus = useEventBus();
const props = defineProps<{
  planOverride?: BillingPlan;
}>();

const store = useAuthStore();
const user = computed(() => store.user);
const plan = computed(() => props.planOverride || user.value?.plan);
</script>

<template>
  <div
    v-if="user"
    class="self-center mx-2 text-white px-2 skew-x-[-20deg] rounded-tl-[5px] rounded-br-[5px] cursor-pointer"
    :class="{
      'bg-gradient-to-r from-orange-500 to-orange-600 ':
        !planOverride && user.earlyAccessExempt,
      'bg-slate-500': plan === BillingPlan.Free,
      'bg-gradient-to-r from-fuchsia-500 to-violet-500':
        plan === BillingPlan.Basic,
      'bg-gradient-to-r from-[#E95252] to-[#E5AD59]':
        plan === BillingPlan.Pro || plan === BillingPlan.Trial,
    }"
    @click="eventBus.$emit('show-subscription-modal')"
  >
    {{ user.earlyAccessExempt ? 'EA' : plan }}
  </div>
</template>
