<template>
  <div class="flex h-screen items-center justify-center bg-gray-100">
    <GoogleLogin :callback="callback" prompt auto-login />
  </div>
</template>

<script setup lang="ts">
import { GoogleLogin } from 'vue3-google-login';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/store';
const authStore = useAuthStore();

const { tokens } = storeToRefs(authStore);

const callback = async (googleResponse: any) => {
  await authStore.login(googleResponse.credential);
}

console.log(tokens);
</script>
