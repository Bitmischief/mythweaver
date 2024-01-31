<script lang="ts" setup>
import { useAuthStore } from '@/store/auth.store.ts';
import { computed } from 'vue';

const store = useAuthStore();
const user = computed(() => store.user);
</script>

<template>
  <div>
    <div class="">Plan: {{ user?.plan }}</div>
    <div class="">Email: {{ user?.email }}</div>
    <div class="">
      Subscription Paid Through: {{ user?.subscriptionPaidThrough }}
    </div>
    <div class="">Image Credit Count: {{ user?.imageCredits }}</div>
  </div>
</template>
