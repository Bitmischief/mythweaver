<template>
  <div class="flex h-screen overflow-y-hidden">
    <div class="relative">
      <div class="absolute w-full h-full bg-black/90"></div>
      <img
        class="absolute bottom-0 w-full z-50 invisible lg:visible pointer-events-none"
        src="/images/MW_login_fg.png"
        alt="fg"
      />

      <div class="grid grid-cols-2 gap-0 md:grid-cols-5">
        <img
          v-for="image in randomizedImages"
          :key="image"
          :src="`/images/samples/${image}`"
          alt=""
        />
      </div>
    </div>
  </div>

  <ModalAlternate :show="true">
    <div
      class="rounded-[25px] bg-gradient-to-r from-fuchsia-500/75 to-purple-500/75 p-0.5"
    >
      <div class="md:flex p-1 bg-neutral-900 rounded-[25px]">
        <div class="md:w-[464px] bg-neutral-800 p-6 w-full rounded-[25px]">
          <img
            src="/images/logo-horizontal-2.svg"
            class="mx-auto h-12 w-auto mb-8"
          />

          <div class="text-neutral-200 text-2xl mb-4 text-center">
            Welcome to MythWeaver
          </div>
          <div class="text-center text-sm mb-8 text-neutral-500">
            <div class="w-2/3 mx-auto">
              Enter your email address and we'll email you a one time magic
              login link.
            </div>
          </div>

          <LoginContent @login-failed="showEarlyAccessModal = true" />
        </div>
        <div class="md:w-[250px] p-6">
          <div class="flex mb-8">
            <span class="self-center">7 day free trial</span>
            <SparklesIcon class="self-center ml-2 h-5 w-5 text-yellow-500" />
          </div>
          <div class="text-sm mb-8 text-neutral-500">
            Fantastic news, adventurers! Immerse yourself in the enchanting
            world of MythWeaver for 7 days, absolutely free.
          </div>
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { shuffleArray } from '@/lib/util.ts';
import LoginContent from '@/components/Login/LoginContent.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import { useAuthStore } from '@/store';
import { useRouter } from 'vue-router';
import { SparklesIcon } from '@heroicons/vue/20/solid';

const authStore = useAuthStore();
const router = useRouter();

const images = [
  '00dc4632-7923-479c-a504-f350c39b9fd9.png',
  '1fb2abf0-d4f0-464e-93d6-37e1f8b8219d.png',
  '3c57d49f-1020-489c-a46a-3c601722ce27.png',
  '8b1b573b-f69e-421e-932c-78a7dab9f814.png',
  '9f909332-8746-4ab1-8b95-fefceb75f741.png',
  '15a858c3-e056-481c-a418-70be9e73a7ac.png',
  '97a56157-2f53-4aa6-97b1-d7de81a99073.png',
  '353a2875-0cc4-4477-8e42-1abb71283f05.png',
  '440d481d-f4cc-46a7-aa42-8fb236d2140c.png',
  '0845ded8-17dd-4bff-81c4-2abc50597619.png',
  '853ebd3c-dd5e-40db-a38a-482c0f531dfa.png',
  '6075b439-7e4f-40de-b2be-dae5cf184b61.png',
  '91928134-8bd2-4e23-8297-2843bde2a018.png',
  'a433f28a-b29a-47e4-85a5-55fc0d3e89f3.png',
  'b7148017-22c2-482d-bf5a-d9b49b4db721.png',
  'c0766b49-3be3-477d-9426-78f0eb3c3bfe.png',
  'cbc17909-abed-47d6-ae99-f0d1f92b0fe8.png',
  'f3b3166e-6462-43e3-90a6-def3f6dc7a2e.png',
];
const randomizedImages = ref<string[]>(shuffleArray(images));

const showEarlyAccessModal = ref(false);

onMounted(async () => {
  if (authStore.tokens) {
    await router.push('/');
  }
});
</script>
