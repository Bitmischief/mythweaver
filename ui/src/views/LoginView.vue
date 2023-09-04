<template>
  <div class="flex h-screen overflow-y-hidden">
    <div class="relative md:flex md:w-[50%]">
      <div
        class="absolute z-50 flex h-full w-full bg-surface/95 md:flex-col md:justify-end md:bg-gradient-to-l"
      >
        <div class="p-6 md:hidden">
          <LoginContent />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-0 md:grid-cols-2">
        <img
          v-for="image in randomizedImages"
          :key="image"
          :src="`/images/generators/characters/${image}`"
          alt=""
        />
      </div>
    </div>
    <div
      class="hidden flex-col bg-gradient-to-b from-surface from-70% via-pink-500/5 via-95% to-pink-500/5 p-4 md:flex md:w-[50%] md:justify-center"
    >
      <div class="flex justify-center">
        <div>
          <img src="/images/logo-horizontal.svg" class="mx-auto h-32 w-auto" />

          <div class="gradient-border-focused mb-8 rounded-xl p-5 md:my-16">
            <div class="text-center text-3xl font-bold">Early Access Only</div>
            <div class="mt-2 text-center text-xl">
              Only those with early access can currently use MythWeaver.
            </div>
            <div
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
  </div>

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
import { ref } from "vue";
import { shuffleArray } from "@/lib/util.ts";
import LoginContent from "@/components/Login/LoginContent.vue";
import Modal from "@/components/Modal.vue";

const images = [
  "townfolk.png",
  "merchants.png",
  "/antagonists/darkOverlord.png",
  "/merchants/armor.png",
  "/merchants/maps.png",
  "/merchants/weapons.png",
  "/merchants/mounts.png",
  "/townfolk/bartender.png",
  "/townfolk/guards.png",
  "/townfolk/scholars.png",
];
const randomizedImages = ref<string[]>(shuffleArray(images));

const showEarlyAccessModal = ref(false);
</script>
