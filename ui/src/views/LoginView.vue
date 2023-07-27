<template>
  <div class="flex h-screen overflow-y-hidden">
    <div class="relative md:w-[50%]">
      <div
        class="absolute z-50 flex h-full w-full flex-col justify-end bg-gradient-to-l from-surface"
      ></div>
      <div class="grid grid-cols-2 gap-0">
        <img
          v-for="image in randomizedImages"
          :key="image"
          :src="getImageUrl(image)"
          alt=""
        />
      </div>
    </div>
    <div
      class="flex flex-col justify-center bg-gradient-to-br from-indigo-500/50 from-0% via-surface/50 via-50% to-pink-500/50 to-100% p-4 md:w-[50%]"
    >
      <div class="flex justify-center">
        <div>
          <img src="/images/logo-horizontal.svg" class="h-32 w-auto" />

          <div class="flex justify-center">
            <div class="mt-8 w-[13.25rem]">
              <div class="flex justify-center">
                <GoogleLogin
                  :callback="callback"
                  class="w-full"
                  prompt
                  auto-login
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { GoogleLogin } from "vue3-google-login";
import { useAuthStore } from "@/store";
import { ref } from "vue";
import { shuffleArray } from "@/lib/util.ts";
const authStore = useAuthStore();

const callback = async (googleResponse: any) => {
  await authStore.login(googleResponse.credential);
};

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

function getImageUrl(fileName: string) {
  return new URL(
    `/images/generators/characters/${fileName}`,
    import.meta.url
  ).toString();
}
</script>
