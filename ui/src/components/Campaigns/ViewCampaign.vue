<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Campaign, CampaignRole, getCampaign } from '@/api/campaigns.ts';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { format } from 'date-fns';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { AxiosError } from 'axios';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
import DragAndDropUploader from '@/components/Core/DragAndDropUploader.vue';
import CampaignFileList from '@/components/Campaigns/CampaignFileList.vue';
import { API_URL } from '@/lib/util.ts';

const campaignStore = useCampaignStore();
const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const router = useRouter();

const campaign = ref<Campaign>({} as Campaign);

const campaignFileUploadUrl = computed(
  () => `${API_URL}/campaigns/${selectedCampaignId.value}/files`,
);

const currentUserRole = computed(() => campaignStore.selectedCampaignRole);

onMounted(async () => {
  if (!selectedCampaignId.value) {
    await router.push('/campaigns/new');
  }

  await init();

  eventBus.$on('campaign-selected', async () => {
    await init();
  });
});

onUnmounted(() => {
  eventBus.$off('campaign-selected');
});

async function init() {
  if (selectedCampaignId.value) {
    const getCampaignResponse = await getCampaign(selectedCampaignId.value);
    campaign.value = getCampaignResponse.data;
  }
}

async function handleSaveCampaign() {
  if (!campaign.value) {
    return;
  }

  try {
    await campaignStore.saveCampaign({
      campaignId: selectedCampaignId.value || 0,
      name: campaign.value.name,
      description: campaign.value.description,
      rpgSystemCode: campaign.value.rpgSystemCode,
    });

    showSuccess({ message: 'Campaign saved!' });
  } catch (e) {
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  }
}

async function handleDeleteCampaign() {
  try {
    if (selectedCampaignId.value) {
      await campaignStore.deleteCampaign(selectedCampaignId.value);
      showSuccess({ message: 'Campaign deleted!' });
      await router.push('/campaign/overview');
    }
  } catch (e) {
    await campaignStore.getCampaigns();
    const err = e as AxiosError;
    showError({
      message: (err?.response?.data as any)?.message?.toString() || '',
    });
    return;
  }
}
</script>

<template>
  <div v-if="campaign">
    <div class="flex w-full justify-between rounded-xl py-4">
      <div class="w-full flex justify-between">
        <div>
          <router-link class="flex button-primary mr-2" to="/campaign/overview">
            <ArrowLeftIcon class="h-4 mr-1" />
            <span class="self-center">Back to overview</span>
          </router-link>
        </div>

        <div class="mt-2 self-center md:mt-0 flex justify-between">
          <button
            v-if="currentUserRole === CampaignRole.DM"
            class="button-ghost mr-2"
            @click="handleSaveCampaign"
          >
            <span class="self-center">Save</span>
          </button>

          <button
            v-if="currentUserRole === CampaignRole.DM"
            class="button-primary"
            @click="handleDeleteCampaign"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="md:flex md:gap-8 w-full justify-between">
      <div class="md:w-[60%]">
        <div class="mt-6 text-gray-400 text-sm ml-1 mb-1">Campaign Name</div>

        <input
          v-model="campaign.name"
          :readonly="currentUserRole !== CampaignRole.DM"
          class="input-primary"
          placeholder="Flight of the Valkyries"
        />

        <div class="mt-8 text-gray-400 text-sm ml-1 mb-1">
          Roleplaying System
        </div>

        <input
          v-model="campaign.rpgSystemCode"
          :readonly="currentUserRole !== CampaignRole.DM"
          class="input-primary"
          placeholder="Bogs & Bullywugs"
        />

        <div class="mt-6 text-gray-400 text-sm ml-1 mb-1">
          Campaign Description
        </div>

        <textarea
          v-model="campaign.description"
          :readonly="currentUserRole !== CampaignRole.DM"
          class="input-primary"
          placeholder="As ancient evils awaken and long-buried secrets resurface, heroes must rise to restore balance in a world on the brink of chaos..."
          rows="8"
        />

        <div class="mt-6 flex justify-between">
          <div class="text-2xl">Party Members</div>
        </div>

        <div class="mt-6">
          <div
            v-for="member of campaign.members"
            :key="member.id"
            class="bg-surface-2 mb-2 rounded-xl p-3"
          >
            <div class="flex justify-between group">
              <div>
                <div
                  class="text-lg"
                  :class="{
                    'text-gray-300': member.user,
                    'text-blue-300': !member.user,
                  }"
                >
                  {{ member.user ? member.user.email : member.email }}
                </div>

                <div
                  class="text-sm"
                  :class="{
                    'text-gray-500': member.user,
                    'text-blue-300': !member.user,
                  }"
                >
                  {{
                    member.user
                      ? member.role === 1
                        ? 'Dungeon Master'
                        : 'Player'
                      : 'Invited'
                  }}
                </div>
              </div>

              <div class="flex">
                <div
                  class="text-sm text-gray-500 self-center"
                  :class="{
                    'text-gray-300': member.user,
                    'text-blue-300': !member.user,
                  }"
                >
                  {{ member.user ? 'Joined' : 'Invited' }} on
                  {{
                    format(
                      new Date(
                        member.user ? member.joinedAt : member.createdAt,
                      ),
                      'MMMM d, yyyy',
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 md:mt-0 md:w-[40%]">
        <div class="">
          <div class="text-2xl">Campaign Files</div>
          <div class="text-gray-400 text-sm self-center">
            Upload files here for MythWeaver to use as context for your
            campaign. This will help MythWeaver generate more accurate and
            relevant content for your campaign.
          </div>
        </div>

        <CampaignFileList />
        <DragAndDropUploader
          :upload-url="campaignFileUploadUrl"
          :drag-and-drop-enabled="false"
        />
      </div>
    </div>
  </div>
</template>
