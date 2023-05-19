<script setup lang="ts">
import {Bars3Icon} from "@heroicons/vue/24/solid";
import {ref} from "vue";
import {Dialog, DialogPanel} from "@headlessui/vue";
import {useAuthStore} from "@/store";
import NavbarContent from "@/components/Navigation/NavbarContent.vue";

const authStore = useAuthStore();
const showPanel = ref(false);

async function logout() {
  await authStore.logout();
}
</script>

<template>
  <div class="flex flex-col w-full justify-between p-4">
    <div>
      <div class="flex justify-between">
        <div class="text-purple-400 text-2xl font-bold uppercase border-b-2 border-b-white/20 mb-6">Merlin</div>
        <div class="md:hidden text-purple-400 mb-6" @click="showPanel = true">
          <Bars3Icon class="w-8 h-8" />
        </div>
      </div>

      <div class="hidden md:flex">
        <NavbarContent />
      </div>
    </div>

    <div class="hidden md:flex">
      <button class="w-full border-2 border-white/5 text-gray-300" @click="logout">Logout</button>
    </div>

    <Dialog
      ref="dialog" :open="showPanel" class="md:hidden fixed inset-0 z-50 flex items-start overflow-y-auto bg-black/5 backdrop-blur lg:hidden"
      @close="showPanel = false">
      <DialogPanel ref="dialogPanel" class="h-screen w-[250px] bg-surface-2 overflow-x-hidden">
        <div class="z-10 w-full h-full p-4 flex flex-col">
          <div class="text-purple-400 text-2xl font-bold uppercase border-b-2 border-b-white/20 mb-6">Merlin</div>

          <div class="h-full flex flex-col justify-between">
            <div>
              <NavbarContent />
            </div>

            <div class="">
              <button class="w-full border-2 border-white/5 text-gray-300" @click="logout">Logout</button>
            </div>
          </div>
        </div>
      </DialogPanel>
    </Dialog>
  </div>
</template>

<style scoped>

</style>
