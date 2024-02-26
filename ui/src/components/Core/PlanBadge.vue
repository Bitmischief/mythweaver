<script setup lang="ts">
import { useAuthStore } from '@/store';
import { computed } from 'vue';

const store = useAuthStore();
const user = computed(() => store.user);
</script>

<template>
  <div
    v-if="user"
    class="self-center mx-2 px-2 skew-x-[-20deg] rounded-tl-[5px] rounded-br-[5px]"
    :class="{
      'bg-gradient-to-r from-orange-500 to-orange-600 ': user.earlyAccessExempt,
      'bg-slate-500': user.plan === 'FREE' || !user.plan,
      'bg-fuchsia-500': user.plan === 'BASIC',
      'bg-gradient-to-r from-fuchsia-500 to-violet-500': user.plan === 'PRO',
    }"
  >
    {{ user.earlyAccessExempt ? 'EA' : !user.plan ? 'FREE' : user.plan }}
  </div>
</template>
