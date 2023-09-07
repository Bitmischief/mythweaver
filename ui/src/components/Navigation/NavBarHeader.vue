<script setup lang="ts">
import { UserIcon, ChevronDownIcon } from '@heroicons/vue/20/solid';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { useAuthStore } from '@/store';

const authStore = useAuthStore();

async function logout() {
  await authStore.logout();
}
</script>

<template>
  <!--  <div class="relative self-center mr-4">-->
  <!--    <div class="absolute left-4 top-3 flex">-->
  <!--      <MagnifyingGlassIcon class="h-6 w-6 self-center text-gray-400" />-->
  <!--    </div>-->
  <!--    <input-->
  <!--      class="self-center w-[408px] h-12 bg-zinc-950 rounded-[60px] pl-14"-->
  <!--      placeholder="Search"-->
  <!--    />-->
  <!--  </div>-->

  <Menu class="self-center">
    <MenuButton class="flex cursor-pointer">
      <div
        class="mr-1 bg-slate-400 rounded-full w-10 h-10 self-center flex justify-center"
      >
        <UserIcon class="h-8 w-8 self-center text-gray-100" />
      </div>
      <ChevronDownIcon class="h-5 w-5 self-center text-gray-100" />
    </MenuButton>

    <template #content>
      <div class="rounded-b-xl bg-surface-2 p-4">
        <MenuItem>
          <button
            class="w-full rounded-xl border-2 border-red-500 px-3 py-1"
            @click="logout"
          >
            Logout
          </button>
        </MenuItem>
      </div>
    </template>
  </Menu>
</template>
