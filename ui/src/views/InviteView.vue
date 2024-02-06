<script setup lang="ts">
import ModalAlternate from '@/components/ModalAlternate.vue';
import LoginContent from '@/components/Login/LoginContent.vue';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  acceptCampaignInvite,
  CampaignInvite,
  getCampaignInvite,
} from '@/api/campaigns.ts';
import { useAuthStore } from '@/store';
import { showSuccess } from '@/lib/notifications.ts';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const campaignStore = useCampaignStore();

const inviteCode = computed(() => route.query.c?.toString());
const invite = ref<CampaignInvite | null>(null);

onMounted(async () => {
  if (!inviteCode.value) return;

  const inviteResponse = await getCampaignInvite(inviteCode.value);
  invite.value = inviteResponse.data as CampaignInvite;

  if (authStore.tokens) {
    await acceptCampaignInvite(inviteCode.value);
    showSuccess({ message: 'Campaign invite accepted!' });
    await campaignStore.loadCampaigns();
    await router.push('/');
  }
});
</script>

<template>
  <ModalAlternate :show="true">
    <div
      v-if="invite && !authStore.tokens"
      class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]"
    >
      <img src="/images/logo-horizontal-2.svg" class="h-12 w-auto mx-auto" />

      <div class="mt-6 text-center text-white text-2xl">You're Invited!</div>

      <div
        class="mt-1 mb-6 text-center w-full text-zinc-500 text-sm font-normal leading-[25px]"
      >
        {{ invite.invitingEmail }} has invited you to join them on MythWeaver
      </div>

      <div class="mt-4 text-center text-4xl font-bold">
        {{ invite.campaignName }}
      </div>

      <div
        v-if="invite.members.length"
        class="mt-4 w-full flex flex-nowrap overflow-x-auto overflow-y-hidden h-52 pb-4"
      >
        <div
          v-for="member in invite.members"
          :key="member.email"
          class="mr-2 h-52 w-52 shrink-0"
        >
          <div class="relative h-48 w-48 bg-surface-3 rounded-[20px]">
            <img
              v-if="
                member.role === CampaignRole.Player &&
                member.character &&
                member.character.imageUri
              "
              :src="member.character.imageUri"
              alt="character portrait"
              class="rounded-[16px]"
            />
            <img
              v-else-if="member.role === CampaignRole.DM"
              src="@/assets/GM.png"
              alt="GM portrait"
              class="rounded-[16px]"
            />
            <QuestionMarkCircleIcon
              v-else
              class="w-44 h-44 p-4 text-neutral-500 m-auto"
            />
            <div
              class="absolute top-2 left-2 rounded-full bg-white/75 text-black self-center px-2"
            >
              {{ member.role === CampaignRole.DM ? 'GM' : 'Player' }}
            </div>
            <div
              v-if="member.character"
              class="absolute bottom-2 left-2 right-2 rounded-full bg-white/75 text-black self-center px-2 truncate"
            >
              {{ member.character.name }}
            </div>
            <div
              v-else
              class="absolute bottom-2 left-2 right-2 rounded-full bg-white/75 text-black self-center px-2 truncate"
            >
              {{ member.email }}
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

      <LoginContent class="mt-6" :invite-code="inviteCode" />
    </div>
  </ModalAlternate>
</template>
