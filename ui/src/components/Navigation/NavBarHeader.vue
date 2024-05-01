<script setup lang="ts">
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { useAuthStore } from '@/store';
import TrialInfo from '@/components/Navigation/TrialInfo.vue';
import { computed } from 'vue';
import ImageCreditCount from '@/components/Core/ImageCreditCount.vue';
import ConjurationLimit from '@/components/Core/ConjurationLimit.vue';
import { useAuth0 } from '@auth0/auth0-vue';

const authStore = useAuthStore();
const auth0 = useAuth0();

async function logout() {
  await auth0.logout({
    logoutParams: {
      returnTo: `${window.location.origin}/auth/login`,
    },
  });
}

const username = computed(() => {
  if (auth0.user.value) {
    return auth0.user.value.nickname;
  }

  let emailAddress = authStore.user?.email || '';
  return emailAddress.substring(0, emailAddress.indexOf('@'));
});

const profilePicutre = computed(() => {
  if (auth0.user.value?.picture) {
    return auth0.user.value.picture;
  }

  return '/favicon.png';
});
</script>

<template>
  <div class="flex pr-6 bg-surface-2">
    <TrialInfo class="self-center" />
    <div class="self-center mr-5">
      <ConjurationLimit v-if="authStore.user" />
    </div>
    <div class="self-center mr-5">
      <ImageCreditCount v-if="authStore.user" />
    </div>
    <Menu class="self-center">
      <MenuButton
        class="flex items-center cursor-pointer border border-zinc-800 rounded-[25px] p-1 pr-2"
      >
        <img
          class="mr-2 bg-zinc-800 rounded-full w-8 h-8 self-center flex justify-center"
          :src="profilePicutre"
          alt="profile picture"
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
