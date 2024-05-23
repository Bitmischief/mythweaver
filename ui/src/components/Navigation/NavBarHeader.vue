<script setup lang="ts">
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { useAuthStore } from '@/store';
import TrialInfo from '@/components/Navigation/TrialInfo.vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ImageCreditCount from '@/components/Core/ImageCreditCount.vue';
import ConjurationLimit from '@/components/Core/ConjurationLimit.vue';
import { useAuth0 } from '@auth0/auth0-vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useWebsocketChannel } from '@/lib/hooks.ts';

const authStore = useAuthStore();
const auth0 = useAuth0();
const channel = useWebsocketChannel();

async function logout() {
  await auth0.logout({
    logoutParams: {
      returnTo: `${window.location.origin}/auth/login`,
    },
  });
}

onMounted(() => {
  channel.bind(
    ServerEvent.UserArtistContributionsUpdated,
    artistContributionsUpdated,
  );
});

const artistContributionsIncreasing = ref(false);

function artistContributionsUpdated(newContributionAmount: number) {
  artistContributionsIncreasing.value = true;

  if (!authStore.user) return;
  authStore.user.amountSupportingArtistsUsd = newContributionAmount;

  setTimeout(() => {
    artistContributionsIncreasing.value = false;
  }, 500);
}

onUnmounted(() => {
  channel.unbind(
    ServerEvent.UserArtistContributionsUpdated,
    artistContributionsUpdated,
  );
});

const username = computed(() => {
  if (authStore.user?.username) {
    return authStore.user?.username;
  }

  let emailAddress = authStore.user?.email || '';
  return emailAddress.substring(0, emailAddress.indexOf('@'));
});

const showArtistMoneyRaised = computed(
  () => (authStore?.user?.amountSupportingArtistsUsd || 0) > 0,
);

const artistMoneyRaised = computed(() =>
  authStore?.user?.amountSupportingArtistsUsd?.toFixed(2),
);
</script>

<template>
  <div
    class="flex w-full px-6 justify-between"
    :class="showArtistMoneyRaised ? 'justify-between' : 'justify-end'"
  >
    <div
      v-if="showArtistMoneyRaised"
      class="hidden md:flex self-center text-neutral-400"
    >
      You have raised&nbsp;
      <span
        :class="{ 'animate-ping duration-500': artistContributionsIncreasing }"
        >${{ artistMoneyRaised }}</span
      >
      &nbsp;for artists
    </div>
    <div class="flex bg-surface-2">
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
            src="/favicon.png"
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
  </div>
</template>
