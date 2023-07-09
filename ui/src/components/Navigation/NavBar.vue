<script setup lang="ts">
import { Bars3Icon } from "@heroicons/vue/24/solid";
import { ref } from "vue";
import { Dialog, DialogPanel } from "@headlessui/vue";
import { useAuthStore } from "@/store";
import NavbarContent from "@/components/Navigation/NavbarContent.vue";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { storeToRefs } from "pinia";

const authStore = useAuthStore();
const showPanel = ref(false);

async function logout() {
  await authStore.logout();
}
</script>

<template>
  <div class="flex w-full flex-col justify-between p-4">
    <div>
      <div class="flex justify-between">
        <div
          class="mb-6 border-b-2 border-b-white/20 text-2xl font-bold uppercase text-purple-400"
        >
          Merlin
        </div>
        <div class="mb-6 text-purple-400 md:hidden" @click="showPanel = true">
          <Bars3Icon class="h-8 w-8" />
        </div>
      </div>

      <div class="hidden w-full md:flex">
        <NavbarContent />
      </div>
    </div>

    <div class="hidden md:flex">
      <button
        class="w-full border-2 border-white/5 text-gray-300"
        @click="logout"
      >
        Logout
      </button>
    </div>

    <Dialog
      ref="dialog"
      :open="showPanel"
      class="fixed inset-0 z-50 flex items-start overflow-y-auto bg-black/5 backdrop-blur md:hidden lg:hidden"
      @close="showPanel = false"
    >
      <DialogPanel
        ref="dialogPanel"
        class="h-screen w-[250px] overflow-x-hidden bg-surface-2"
      >
        <div class="z-10 flex h-full w-full flex-col p-4">
          <div
            class="mb-6 border-b-2 border-b-white/20 text-2xl font-bold uppercase text-purple-400"
          >
            Merlin
          </div>

          <div class="flex h-full flex-col justify-between">
            <div>
              <NavbarContent />
            </div>

            <div class="">
              <button
                class="w-full border-2 border-white/5 text-gray-300"
                @click="logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </div>
</template>

<style scoped></style>
