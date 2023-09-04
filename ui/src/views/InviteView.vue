<script setup lang="ts">
import ModalAlternate from "@/components/ModalAlternate.vue";
import LoginContent from "@/components/Login/LoginContent.vue";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  acceptCampaignInvite,
  CampaignInvite,
  getCampaignInvite,
} from "@/api/campaigns.ts";
import { useAuthStore } from "@/store";
import { showSuccess } from "@/lib/notifications.ts";
import { useCampaignStore } from "@/store/campaign.store.ts";

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
    showSuccess({ message: "Campaign invite accepted!" });
    await campaignStore.loadCampaigns();
    await router.push("/");
  }
});
</script>

<template>
  <ModalAlternate :show="true">
    <div
      v-if="invite && !authStore.tokens"
      class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]"
    >
      <img src="/images/logo-horizontal.svg" class="h-12 w-auto mx-auto" />

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
        class="mt-4 grid md:grid-cols-4 content-stretch gap-5"
      >
        <div
          v-for="member in invite.members"
          :key="member.characterName"
          class="bg-slate-800 rounded-xl h-24 w-24 group"
        >
          <div
            class="group-hover:w-full w-0 h-full bg-black/25 rounded-xl flex justify-center transition-all duration-150 ease-in-out"
          >
            <div class="overflow-hidden self-center">
              {{ member.characterName }}
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
