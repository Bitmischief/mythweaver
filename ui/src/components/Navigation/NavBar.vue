<script setup lang="ts">
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
} from "@heroicons/vue/24/solid";
import { ref } from "vue";
import { Dialog, DialogPanel } from "@headlessui/vue";
import { useAuthStore } from "@/store";
import NavbarContent from "@/components/Navigation/NavbarContent.vue";

const authStore = useAuthStore();
const showPanel = ref(false);

async function logout() {
  await authStore.logout();
}

const collapsed = ref(false);
const toggleCollapsed = function () {
  collapsed.value = !collapsed.value;
};
</script>

<template>
  <div
    class="nav-bar px-1 md:h-full border-white/5 md:max-w-[300px] md:min-w-[300px]"
    :class="{ 'md:max-w-[90px] md:min-w-[90px]': collapsed }"
  >
    <div
      class="bg-surface-2 md:h-full flex flex-col justify-between p-4 relative"
    >
      <div>
        <div class="flex justify-between">
          <img
            v-if="!collapsed"
            src="/images/logo-horizontal.svg"
            class="h-12 w-auto mx-auto"
          />
          <img v-else src="/favicon.png" class="h-12 w-auto" />
          <div
            class="self-center text-purple-400 md:mb-6 md:hidden"
            @click="showPanel = true"
          >
            <Bars3Icon class="h-8 w-8" />
          </div>
        </div>

        <div class="hidden w-full md:flex">
          <NavbarContent :collapsed="collapsed" />
        </div>
        <div
          class="hidden h-8 w-8 absolute inset-y-1/2 -right-5 md:flex justify-center items-center cursor-pointer z-10"
          style="background: #171717"
          @click="toggleCollapsed"
        >
          <ChevronDoubleLeftIcon
            class="nav-collapser h-6 w-6 text-gray-500 hover:text-gray-400"
            :class="{ collapsed: collapsed }"
          />
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
  </div>
</template>

<style scoped>
.logo-gradient {
  background: linear-gradient(135deg, #c952e9 0%, #59c3e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-bar {
  transition: all 0.5s ease-in;
}
.nav-collapser {
  transition: transform 0.5s ease-in-out;
  &.collapsed {
    transform: rotate(180deg);
    transition: transform 0.5s ease-in-out;
  }
}
</style>
