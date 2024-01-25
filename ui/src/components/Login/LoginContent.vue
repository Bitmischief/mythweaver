<script setup lang="ts">
import { computed, ref } from 'vue';
import { SparklesIcon } from '@heroicons/vue/24/outline';
import { postMagicLink } from '@/api/auth.ts';
import { useRouter } from 'vue-router';
import { AxiosError } from 'axios';
import { showError } from '@/lib/notifications.ts';

const fbq = (window as any).fbq;

const props = defineProps<{
  inviteCode?: string | undefined;
}>();

const router = useRouter();

const email = ref('');
const triedToSubmit = ref(false);
const isLoading = ref(false);

const isEmailValid = computed(() => {
  const regex = new RegExp(
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
  );
  return email.value && regex.test(email.value);
});

async function login() {
  if (!isEmailValid.value) {
    triedToSubmit.value = true;
    return;
  }

  try {
    isLoading.value = true;
    await postMagicLink(email.value, props.inviteCode);
    fbq('track', 'Lead');
    await router.push('/preauth');
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="w-full">
    <div class="text-white">Email address</div>

    <input
      v-model="email"
      autofocus
      name="email"
      class="input-primary"
      :class="{
        'border-red-500': !isEmailValid && triedToSubmit,
        'gradient-border-no-opacity': isEmailValid || !triedToSubmit,
      }"
      @keyup.enter="login"
      placeholder="Enter your email address"
    />
    <div
      v-if="!isEmailValid && triedToSubmit"
      class="mt-1 text-sm text-red-500"
    >
      The email provided is invalid
    </div>

    <div class="mt-1 text-xs text-neutral-500 text-center px-1">
      By continuing you are agreeing to the
      <a
        href="https://mythweaver.co/docs/terms.pdf"
        class="underline"
        target="_blank"
        >Terms</a
      >,
      <a
        href="https://mythweaver.co/docs/privacy.pdf"
        class="underline"
        target="_blank"
        >Privacy Policy</a
      >, and to sign up for our mailing list.
    </div>

    <button
      class="mt-6 w-full flex text-center justify-center self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-3 transition-all hover:scale-110"
      @click="login"
    >
      <template v-if="!isLoading">
        <span class="self-center text-sm">Send magic link</span>
        <SparklesIcon class="ml-2 h-5 w-5 self-center" />
      </template>
      <span v-else class="text-sm animate-pulse">loading...</span>
    </button>
  </div>
</template>
