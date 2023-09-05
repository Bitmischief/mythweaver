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
      <LoginContent />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { shuffleArray } from "@/lib/util.ts";
import LoginContent from "@/components/Login/LoginContent.vue";

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
</script>
