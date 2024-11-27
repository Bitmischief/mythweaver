<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/20/solid';
import {
  Campaign,
  createCampaign,
  acceptCampaignInvite,
} from '@/api/campaigns.ts';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccess, showError } from '@/lib/notifications.ts';
import { CAMPAIGN_CREATED_EVENT, useEventBus } from '@/lib/events.ts';
import { useCampaignStore } from '@/store/campaign.store.ts';
import Loader from '../Core/Loader.vue';

const router = useRouter();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const campaign = ref<Campaign>({
  name: '',
  rpgSystemCode: 'D&D',
  publicAdventureCode: null,
} as Campaign);

const campaignName = ref<HTMLElement | null>(null);
const inviteCode = ref<string>();

onMounted(async () => {
  campaignName.value?.focus();
});

const loading = ref(false);
const loadingMessage = ref('');

async function handleCreateCampaign() {
  try {
    loading.value = true;
    loadingMessage.value = 'Creating campaign...';

    const createCampaignResponse = await createCampaign({
      ...campaign.value,
      name: campaign.value.name.length ? campaign.value.name : 'New Campaign',
    });
    await campaignStore.selectCampaign(createCampaignResponse.data.id);
    await campaignStore.getCampaigns();

    eventBus.$emit(CAMPAIGN_CREATED_EVENT, undefined);

    showSuccess({ message: 'Campaign created!' });
    await router.push('/campaign/overview');
  } catch {
    showError({
      message: 'Something went wrong creating your campaign.',
      context:
        'Please try again, or contact our support team if the problem persists.',
    });
  } finally {
    loading.value = false;
  }
}

async function joinExistingCampaign() {
  if (!inviteCode.value) {
    return;
  }

  try {
    loadingMessage.value = 'Joining campaign...';
    await acceptCampaignInvite(inviteCode.value);
    showSuccess({ message: 'Campaign invite accepted!' });
    await campaignStore.loadCampaigns();
    await router.push('/campaigns');
  } catch {
    showError({
      message:
        'Unable to join an existing campgin using that code, please verify that the code you entered is correct.',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center justify-center my-auto">
    <div
      class="text-white md:min-w-[30em] max-w-[50em] max-h-[50em] bg-surface-2 rounded-[20px] p-10"
    >
      <div v-if="loading">
        <Loader />
        <div class="text-center mt-8 mb-2">Creating campaign...</div>
      </div>
      <div v-else>
        <div>
          <div class="text-center text-white text-xl text-neutral-500">
            Create a new campaign
          </div>
          <div class="mt-8 text-sm text-gray-400 m-1">Campaign Name</div>

          <input
            ref="campaignName"
            v-model="campaign.name"
            autofocus
            class="input-ghost"
            placeholder="What should we call this campaign?"
          />

          <div class="mt-8 mb-1 text-sm text-gray-400 m-1">
            Roleplaying System
          </div>

          <input
            ref="rpgSystemCode"
            v-model="campaign.rpgSystemCode"
            class="input-ghost"
            placeholder="What roleplaying system are you using?"
          />

          <div class="mt-6 text-center">
            <button
              class="mt-4 rounded-xl bg-gradient px-4 py-3 text-sm"
              @click="handleCreateCampaign"
            >
              <PlusIcon class="inline-block h-5 w-5" /> Create new campaign
            </button>
          </div>
        </div>
        <div class="flex text-neutral-500 mt-8">
          <div class="grow self-center">
            <hr class="border-neutral-500" />
          </div>
          <div class="mx-4">or</div>
          <div class="grow self-center">
            <hr class="border-neutral-500" />
          </div>
        </div>
        <div>
          <div class="text-center text-neutral-500 mt-4 mb-6">
            Have a link to an ongoing campaign?
          </div>
          <div class="md:flex">
            <input
              v-model="inviteCode"
              class="input-primary md:rounded-r-none"
              placeholder="Paste campaign invite code here"
            />
            <button
              class="mt-2 md:mt-0 button-primary whitespace-nowrap w-full md:w-auto md:rounded-l-none"
              @click="joinExistingCampaign"
            >
              Join Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
