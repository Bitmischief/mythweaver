<script setup lang="ts">
import ModalAlternate from '@/components/ModalAlternate.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  acceptCampaignInvite,
  CampaignInvite,
  getCampaignInvite,
} from '@/api/campaigns.ts';
import { useAuthStore } from '@/store';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { useAuth0 } from '@auth0/auth0-vue';
import Spinner from '@/components/Core/Spinner.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const campaignStore = useCampaignStore();
const { loginWithRedirect, isAuthenticated, user } = useAuth0();
const email = user.value?.email;

const inviteCode = computed(() => route.query.code?.toString());
const invite = ref<CampaignInvite | null>(null);

onMounted(async () => {
  try {
    if (!inviteCode.value) {
      console.log('no invite code');
    } else {
      const inviteResponse = await getCampaignInvite(inviteCode.value);
      invite.value = inviteResponse.data as CampaignInvite;
    }
  } catch (err) {
    console.error(err);
  }
});

const accepting = ref(false);
const acceptInvite = async () => {
  if (!inviteCode.value) return;

  accepting.value = true;
  try {
    await acceptCampaignInvite(inviteCode.value);
    showSuccess({ message: 'Campaign invite accepted!' });
    await campaignStore.loadCampaigns();
    await router.push('/characters');
  } catch (err) {
    showError({
      message:
        'Something went wrong accepting the campaign invite. Please try again.',
    });
  } finally {
    accepting.value = false;
  }
};

const register = async () => {
  await loginWithRedirect({
    authorizationParams: {
      screen_hint: 'signup',
    },
    appState: {
      target: `/auth/invite?code=${inviteCode.value}`,
    },
  });
};
</script>

<template>
  <ModalAlternate :show="true">
    <div
      v-if="invite && !authStore.tokens"
      class="w-[90vw] md:w-[50vw] p-6 bg-neutral-900 rounded-[20px]"
    >
      <img src="/images/logo-horizontal-2.svg" class="h-16 w-auto mx-auto" />

      <div class="mt-6 text-center text-white text-2xl">
        You've been invited to join
        <span class="gradient-text"> {{ invite.campaignName }}! </span>
      </div>

      <div
        class="mt-1 mb-6 text-center w-full text-neutral-400 font-normal leading-[25px]"
      >
        <span class="gradient-text">
          {{ invite.invitingEmail }}
        </span>
        has invited you to join their campaign on MythWeaver
      </div>

      <div v-if="isAuthenticated" class="text-center">
        <div
          class="flex flex-wrap md:flex-nowrap justify-center text-lg md:text-2xl text-neutral-200 my-4"
        >
          <div>Welcome to MythWeaver</div>
          <div v-if="user" class="ml-1">
            <span class="gradient-text">{{ email }}</span
            >!
          </div>
        </div>
        <button
          class="w-full md:w-auto button-gradient text-lg py-4"
          :disabled="accepting"
          @click="acceptInvite"
        >
          <span v-if="!accepting">Accept Invite</span>
          <span v-else class="flex gap-2">
            Accepting invite<Spinner class="h-5 w-5 self-center" />
          </span>
        </button>
      </div>
      <div v-else class="text-center">
        <button class="button-gradient text-lg py-4" @click="register">
          Create An Account
        </button>
      </div>

      <div v-if="invite.members.length" class="mt-6 w-full">
        <div class="flex w-full">
          <div class="grow self-center px-2">
            <hr class="border-neutral-700" />
          </div>
          <div class="self-center text-neutral-400">Current Characters</div>
          <div class="grow self-center px-2">
            <hr class="mt-1/2 border-neutral-700" />
          </div>
        </div>
        <div class="w-full">
          <div
            v-for="member in invite.members"
            :key="member.email"
            class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
          >
            <div
              v-for="character in member.character"
              :key="character.id"
              class="flex p-4 bg-surface-3 rounded-[20px]"
            >
              <div
                class="basis-1/4 min-h-24 min-w-24 bg-neutral-900 rounded-[20px]"
              >
                <div class="relative">
                  <img
                    :src="
                      character.imageUri || 'images/character_bg_square.png'
                    "
                    alt="character portrait"
                    class="rounded-[16px]"
                  />
                  <div
                    v-if="!character.imageUri"
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 text-neutral-300 text-lg"
                  >
                    No Image
                  </div>
                </div>
              </div>
              <div class="basis-3/4 overflow-hidden">
                <div class="self-center px-2">
                  <div class="truncate">
                    <span class="text-neutral-500">Name:</span>
                    {{ character.name }}
                  </div>
                  <div class="truncate">
                    <span class="text-neutral-500">Race:</span>
                    {{ character.race }}
                  </div>
                  <div class="truncate">
                    <span class="text-neutral-500">Class:</span>
                    {{ character.class }}
                  </div>
                </div>
                <div class="self-center px-2 truncate">
                  <span class="text-neutral-500">Player:</span>
                  {{ member.email }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div
          class="my-4 mb-6 text-center w-full text-zinc-300 text-xl font-normal leading-[25px]"
        >
          Step into an epic tale awaiting your character. Your adventure in
          {{ invite.campaignName }} beckons!
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>
