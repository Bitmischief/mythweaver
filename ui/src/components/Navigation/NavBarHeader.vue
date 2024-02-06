<script setup lang="ts">
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { useAuthStore } from '@/store';
import EarlyAccessInfo from '@/components/Navigation/EarlyAccessInfo.vue';
import { computed } from 'vue';
import ImageCreditCount from '@/components/Core/ImageCreditCount.vue';

const authStore = useAuthStore();

async function logout() {
  await authStore.logout();
}

const username = computed(() => {
  if (authStore.user?.username) {
    return authStore.user.username;
  }

  let emailAddress = authStore.user?.email || '';
  return emailAddress.substring(0, emailAddress.indexOf('@'));
});
</script>

<template>
  <div class="flex pr-6 bg-surface-2">
    <EarlyAccessInfo class="self-center" />
    <div class="self-center mr-5">
      <ImageCreditCount v-if="authStore.user" />
    </div>
    <Menu class="self-center">
      <MenuButton
        class="flex items-center cursor-pointer border border-zinc-800 rounded-[25px] p-1 pr-2"
      >
        <img
          class="mr-2 bg-zinc-800 rounded-full w-8 h-8 self-center flex justify-center"
          src="/favicon.png"
          alt="img"
        />
        <div class="pr-2">
          {{ username }}
        </div>
      </MenuButton>

      <template #content>
        <div class="relative z-60 bg-surface-3 p-2 rounded-[20px]">
          <MenuItem class="mb-2">
            <router-link to="/account-settings">
              <div
                class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200 text-center"
              >
                Account Settings
              </div>
            </router-link>
          </MenuItem>
          <MenuItem>
            <button
              class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200"
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
