<template>
  <div class="flex h-screen overflow-y-hidden">
    <div class="relative">
      <div class="absolute w-full h-full bg-black/95"></div>

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

  <ModalAlternate :show="true"
    ><div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="w-full">
        <img
          src="/images/logo-horizontal.svg"
          class="mx-auto h-20 w-auto mb-8"
        />

        <div class="text-red-500 text-3xl mb-2 text-center">
          Your Early Access has Expired
        </div>

        <div class="text-neutral-400 mt-4 text-xl text-center">
          Want an extension? Click the button below to learn more!
        </div>

        <div class="flex mt-8">
          <router-link
            to="/login"
            class="block w-[12rem] text-center bg-neutral-800 rounded-md py-2 px-2"
          >
            Back to login
          </router-link>
          <a
            href="https://mythweaver.co/earlyaccess"
            target="_blank"
            class="bg-gradient-to-r w-full from-fuchsia-500 to-blue-400 transition-all hover:scale-110 py-2 ml-2 text-center px-4 rounded-md"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { shuffleArray } from '@/lib/util.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';

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
</script>
