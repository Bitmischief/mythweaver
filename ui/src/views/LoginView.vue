<template>
  <div class="fixed inset-0 bg-surface z-50 flex justify-center">
    <div class="my-auto">
      <Loader />
      <div class="text-center text-xl mt-4 text-neutral-300">Loading...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuth0 } from '@auth0/auth0-vue';
import Loader from '@/components/Core/Loader.vue';

const route = useRoute();
const { loginWithRedirect } = useAuth0();

onMounted(async () => {
  if (!(route.query.code && route.query.state)) {
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: 'login',
      },
      appState: {
        target: `/conjurations#gallery`,
      },
    });
  }
});
</script>
