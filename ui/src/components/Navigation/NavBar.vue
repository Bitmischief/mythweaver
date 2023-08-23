<script setup lang="ts">
import { Bars3Icon } from "@heroicons/vue/24/solid";
import { ref } from "vue";
import { Dialog, DialogPanel } from "@headlessui/vue";
import { useAuthStore } from "@/store";
import NavbarContent from "@/components/Navigation/NavbarContent.vue";

const authStore = useAuthStore();
const showPanel = ref(false);

async function logout() {
  await authStore.logout();
}
</script>

<template>
  <div class="flex flex-col justify-between p-4">
    <div>
      <div class="flex justify-between">
        <div
          class="h-[3rem] logo-gradient text-[26px] flex justify-center self-center font-bold text-center w-full"
        >
          <span class="self-center">MythWeaver</span>
        </div>
        <div
          class="self-center text-purple-400 md:mb-6 md:hidden"
          @click="showPanel = true"
        >
          <Bars3Icon class="h-8 w-8" />
        </div>
      </div>

      <div class="hidden w-full md:flex">
        <NavbarContent />
      </div>
    </div>

    <Dialog
      ref="dialog"
      :open="showPanel"
      class="fixed inset-0 z-50 flex items-start overflow-y-auto bg-black/50 backdrop-blur md:hidden lg:hidden"
      @close="showPanel = false"
    >
      <DialogPanel
        ref="dialogPanel"
        class="bg-surface-2 h-screen w-[250px] overflow-x-hidden"
      >
        <div class="z-10 flex h-full w-full flex-col p-4">
          <img src="/images/logo-horizontal.svg" class="h-20 w-auto" />

          <div class="flex h-full flex-col justify-between">
            <div>
              <NavbarContent @nav-item-selected="showPanel = false" />
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

<style scoped>
.logo-gradient {
  background: linear-gradient(135deg, #c952e9 0%, #59c3e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
