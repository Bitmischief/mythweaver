<script lang="ts" setup>
import { useCurrentUserId } from '@/lib/hooks.ts';

const currentUserId = useCurrentUserId();
</script>

<template>
  <router-view v-if="currentUserId"></router-view>
</template>
