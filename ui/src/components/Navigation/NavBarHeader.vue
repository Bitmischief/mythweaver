<script setup lang="ts">
import { UserIcon, ChevronDownIcon } from '@heroicons/vue/20/solid';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { useAuthStore } from '@/store';
import EarlyAccessInfo from '@/components/Navigation/EarlyAccessInfo.vue';
import { getBillingPortalUrl } from '@/api/billing.ts';

const authStore = useAuthStore();

async function logout() {
  await authStore.logout();
}

async function clickBilling() {
  const portalUrlResponse = await getBillingPortalUrl();
  location.href = portalUrlResponse.data;
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

  <div class="flex">
    <EarlyAccessInfo class="self-center" />

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
        <div
          class="rounded-b-xl relative z-50 bg-surface-2 border-b-2 border-x-2 border-neutral-800 p-4"
        >
          <MenuItem class="mb-2">
            <button
              class="w-full rounded-md border border-neutral-700 px-3 py-1"
              @click="clickBilling"
            >
              Billing
            </button>
          </MenuItem>
          <MenuItem>
            <button
              class="w-full rounded-md border border-red-500 px-3 py-1"
              @click="logout"
            >
              Logout
            </button>
          </MenuItem>
        </div>
      </template>
    </Menu>
  </div>
</template>
