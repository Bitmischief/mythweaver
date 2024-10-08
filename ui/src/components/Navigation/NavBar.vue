<script setup lang="ts">
import { Bars3Icon } from '@heroicons/vue/24/solid';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Dialog, DialogPanel } from '@headlessui/vue';
import { useAuthStore } from '@/store';
import NavbarContent from '@/components/Navigation/NavbarContent.vue';
import TrialInfo from '@/components/Navigation/TrialInfo.vue';
import { useIntercom } from '@homebaseai/vue3-intercom';
import ImageCreditCount from '../Core/ImageCreditCount.vue';
import PlanBadge from '@/components/Core/PlanBadge.vue';
import { Cog6ToothIcon } from '@heroicons/vue/24/outline';
import ConjurationLimit from '@/components/Core/ConjurationLimit.vue';
import { useAuth0 } from '@auth0/auth0-vue';
import UpdateChecker from '@/components/Core/UpdateChecker.vue';
import Tooltip from '../Core/Tooltip.vue';

const authStore = useAuthStore();
const showPanel = ref(false);
const auth0 = useAuth0();

const statusRefreshId = ref(0);

onMounted(() => {
  statusRefreshId.value = setInterval(() => {
    refreshStatusBadge();
  }, 60 * 1000) as unknown as number;
});

onUnmounted(() => {
  clearInterval(statusRefreshId.value);
});

function refreshStatusBadge() {
  (document.querySelector('[data-status-badge]') as HTMLIFrameElement).src = (
    document.querySelector('[data-status-badge]') as HTMLIFrameElement
  ).src;
}

async function logout() {
  await auth0.logout({
    logoutParams: {
      returnTo: `${window.location.origin}/auth/login`,
    },
  });
}

const collapsed = ref(false);
const intercom = useIntercom();

const thirdPartySignin = computed(() => {
  const sub = auth0.user.value?.sub?.toLowerCase();
  return (
    sub?.includes('discord') ||
    sub?.includes('google') ||
    sub?.includes('twitter') ||
    sub?.includes('facebook')
  );
});
const loginType = computed(() => {
  const sub = auth0.user.value?.sub?.toLowerCase();
  return sub?.includes('discord')
    ? 'Discord'
    : sub?.includes('google')
      ? 'Google'
      : sub?.includes('twitter')
        ? 'Twitter'
        : sub?.includes('facebook')
          ? 'Facebook'
          : 'Email';
});

const appVersion = computed(() => import.meta.env.VITE_VERSION);
</script>

<template>
  <div
    class="nav-bar md:h-full border-r border-zinc-900 md:max-w-[256px] md:min-w-[256px] z-10 overflow-y-auto overflow-x-hidden"
    :class="{ 'md:max-w-[90px] md:min-w-[90px]': collapsed }"
  >
    <div
      class="bg-surface-2 md:h-[calc(100%-2.5rem)] flex flex-col justify-between p-4 relative"
    >
      <div class="h-full">
        <div class="flex justify-between">
          <div class="flex">
            <Tooltip :text="`MythWeaver ${appVersion}`" position="bottom">
              <img
                src="/images/logo-horizontal-2.svg"
                alt="mythweaver logo"
                class="hidden md:block h-10 w-auto mr-auto mt-1 mb-1 self-center"
              />
            </Tooltip>
            <Tooltip :text="`MythWeaver ${appVersion}`">
              <img
                src="/favicon.png"
                alt="mythweaver icon"
                class="md:hidden h-10 w-auto mr-auto mt-1 mb-1 self-center"
              />
            </Tooltip>
            <PlanBadge />
          </div>

          <div class="flex md:hidden gap-2">
            <ConjurationLimit v-if="authStore.user" collapsed />
            <ImageCreditCount v-if="authStore.user" collapsed />
            <div
              class="self-center text-purple-400 md:mb-6 ml-4"
              @click="showPanel = true"
            >
              <Bars3Icon class="h-8 w-8" />
            </div>
          </div>
        </div>

        <TrialInfo class="self-center md:hidden mt-2" />
        <UpdateChecker />

        <div class="hidden w-full h-full md:flex md:flex-col justify-between">
          <NavbarContent :collapsed="collapsed" />

          <div>
            <hr class="py-2 mb-2 border-neutral-800 -mx-5" />
            <div
              class="flex px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-rounded-purple"
            >
              <img
                src="@/assets/icons/discord_icon_white.svg"
                alt="support"
                class="h-4 mr-2 self-center"
              />
              <a href="https://discord.gg/vbccbz8Jhp" target="_blank">
                Join our discord
              </a>
            </div>
            <div
              class="flex px-4 py-2 text-sm text-gray-300 cursor-pointer hover:bg-rounded-purple"
              @click="intercom.show()"
            >
              <img
                src="@/assets/icons/support.svg"
                alt="support"
                class="h-5 mr-2"
              />
              Support Center
            </div>
            <div class="flex justify-center my-1 ml-3">
              <iframe
                data-status-badge="true"
                src="https://status.mythweaver.co/badge?theme=dark"
                height="30"
                :class="[collapsed ? 'w-5' : 'w-full']"
                frameborder="0"
                scrolling="no"
              ></iframe>
            </div>
            <div v-if="thirdPartySignin">
              <div class="text-sm text-neutral-400 text-center mx-2 my-2">
                Currently logged in as {{ auth0.user?.value?.nickname }} via
                {{ loginType }}
              </div>
            </div>
            <div
              v-else-if="authStore.user"
              class="text-center text-neutral-400 text-xs"
            >
              Logged in as <span>{{ authStore.user.email }}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        ref="dialog"
        :open="showPanel"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur md:hidden lg:hidden"
        @close="showPanel = false"
      >
        <DialogPanel
          ref="dialogPanel"
          class="bg-surface-2 h-full overflow-y-auto w-[250px] overflow-x-hidden"
        >
          <div class="z-10 flex h-full w-full flex-col p-4">
            <img src="/images/logo-horizontal-2.svg" class="h-20 w-auto" />

            <div class="flex h-full flex-col justify-between">
              <div>
                <NavbarContent @nav-item-selected="showPanel = false" />
              </div>
              <div class="mb-4">
                <div class="text-xs text-gray-500 font-bold mb-3 mt-6">
                  ACCOUNT
                </div>
                <router-link
                  class="nav-item"
                  to="/account-settings"
                  @click="showPanel = false"
                >
                  <Cog6ToothIcon class="h-5 mr-2" />
                  <div class="whitespace-nowrap">Account Settings</div>
                </router-link>
              </div>
              <div>
                <hr class="py-2 border-neutral-800 -mx-4" />
                <div
                  class="flex px-1 py-3 text-sm text-gray-300 cursor-pointer hover:bg-rounded-purple"
                  @click="intercom.show()"
                >
                  <img
                    src="@/assets/icons/support.svg"
                    alt="support"
                    class="h-5 mr-2"
                  />
                  Support Center
                </div>
                <iframe
                  data-status-badge="true"
                  src="https://status.mythweaver.co/badge?theme=dark"
                  height="30"
                  frameborder="0"
                  scrolling="no"
                ></iframe>
                <hr class="py-2 border-neutral-800 -mx-4 mt-5" />

                <div v-if="thirdPartySignin">
                  <div class="text-sm text-neutral-400 text-center mx-2 my-2">
                    Currently logged in as {{ auth0.user?.value?.nickname }} via
                    {{ loginType }}
                  </div>
                </div>
                <div
                  v-else-if="authStore.user"
                  class="text-center text-neutral-400 text-xs"
                >
                  Logged in as <span>{{ authStore.user.email }}</span>
                </div>
                <button
                  class="button-ghost-primary mt-4 mb-4 w-full"
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
