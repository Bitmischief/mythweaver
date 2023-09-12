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
      <div class="flex justify-center">
        <div>
          <img src="/images/logo-horizontal.svg" class="mx-auto h-20 w-auto" />

          <div
            class="gradient-border-focused mb-8 rounded-xl p-5 mt-6 md:my-16"
          >
            <div class="text-center text-3xl font-bold">Early Access Only</div>
            <div class="mt-2 text-center text-xl">
              Only those with early access can currently use MythWeaver.
            </div>
            <div
              id="early-access-link"
              class="mt-2 cursor-pointer text-center text-xl text-purple-300 underline"
              @click="showEarlyAccessModal = true"
            >
              Apply for Early Access Now!
            </div>
          </div>

          <LoginContent @login-failed="showEarlyAccessModal = true" />
        </div>
      </div>
    </div>
  </ModalAlternate>

  <Modal
    :show="showEarlyAccessModal"
    title="Get Early Access Now!"
    bg-image="/images/dragon-bg.png"
    :bg-opacity="0.25"
    @close="showEarlyAccessModal = false"
  >
    <div class="flex flex-col items-center md:h-[40rem]">
      <div class="flex h-full flex-col justify-center">
        <div class="text-center text-4xl text-gray-200 md:text-6xl">
          Early access is currently invite only
          <!--          <span class="font-bold text-purple-500 underline">OPEN NOW</span>-->
        </div>

        <div
          class="mt-8 px-4 text-center text-2xl text-gray-200 md:px-16 md:text-4xl"
        >
          But we are opening up early access to mailing list subscribers soon!
          Join our mailing list for more info!
        </div>

        <div
          class="mt-12 flex justify-center text-xl text-gray-200 md:text-3xl"
        >
          <div>
            #1 Join our mailing list
            <a
              href="https://mythweaver.co/#mailing"
              id="mailing-list-link"
              class="ml-2 text-indigo-500"
              >here</a
            >
          </div>
        </div>
      </div>
    </div>

    <!--        <div class="mt-12 flex justify-center">-->
    <!--          <ol type="1" class="text-xl text-gray-200 md:text-3xl">-->
    <!--            <li>-->
    <!--              #1 Join our mailing list-->
    <!--              <a href="https://mythweaver.co/#mailing" class="text-indigo-500"-->
    <!--                >here</a-->
    <!--              >-->
    <!--            </li>-->
    <!--            <li class="mt-1">-->
    <!--              #2 Join our Discord server-->
    <!--              <a href="https://mythweaver.co/#mailing" class="text-indigo-500"-->
    <!--                >here</a-->
    <!--              >-->
    <!--            </li>-->
    <!--          </ol>-->
    <!--        </div>-->
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { shuffleArray } from '@/lib/util.ts';
import LoginContent from '@/components/Login/LoginContent.vue';
import Modal from '@/components/Modal.vue';
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

const showEarlyAccessModal = ref(false);
</script>
