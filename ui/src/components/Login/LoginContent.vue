<script setup lang="ts">
import { GoogleLogin } from 'vue3-google-login';
import { useAuthStore } from '@/store';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventBus } from '@/lib/events.ts';

const props = defineProps<{
  inviteCode?: string | undefined;
}>();

const emit = defineEmits(['login-failed']);

const authStore = useAuthStore();
const route = useRoute();
const eventBus = useEventBus();

onMounted(async () => {
  if (route.query.c) {
    await callback({
      credential: route.query.c,
    });
  }
});

const callback = async (googleResponse: any) => {
  eventBus.$emit('global-loading-start');
  const result = await authStore.login(
    googleResponse.credential,
    props.inviteCode,
  );
  eventBus.$emit('global-loading-stop');

  if (!result) {
    emit('login-failed');
  }
};
</script>

<template>
  <div class="flex justify-center">
    <div class="w-[13.25rem]">
      <div class="flex justify-center">
        <GoogleLogin
          :callback="callback"
          class="w-full mx-auto"
          prompt
          auto-login
        />
      </div>
    </div>
  </div>
</template>
