<template>
  <div class="fixed inset-0 bg-surface z-50 flex justify-center">
    <div class="my-auto">
      <Loader />
      <div class="text-center text-xl mt-4 text-neutral-300">
        Teleporting you to login...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/store';
import { useRoute, useRouter } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import Loader from '@/components/Core/Loader.vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const { loginWithRedirect, handleRedirectCallback } = useAuth0();

onMounted(async () => {
  if (route.query.code && route.query.state) {
    await handleRedirectCallback();
    if (authStore.returnUrl) {
      await router.push(authStore.returnUrl);
    } else {
      await router.push('/');
    }
  } else {
    await loginWithRedirect();
  }
});
</script>
