<script lang="ts" setup>
import { deleteCampaignFile, getCampaignFiles } from '@/api/campaigns.ts';
import { useSelectedCampaignId, useWebsocketChannel } from '@/lib/hooks.ts';
import { onMounted, onUnmounted, ref } from 'vue';
import { TrashIcon } from '@heroicons/vue/24/solid';
import { showError } from '@/lib/notifications.ts';
import { ServerEvent } from '@/lib/serverEvents.ts';

const campaignId = useSelectedCampaignId();
const channel = useWebsocketChannel();
const files = ref([]);

onMounted(async () => {
  await loadCampaignFiles();
});

onMounted(() => {
  channel.bind(ServerEvent.CampaignFileProcessed, handleFileProcessed);
});

onUnmounted(() => {
  channel.bind(ServerEvent.CampaignFileProcessed, handleFileProcessed);
});

async function handleFileProcessed(request: {
  campaignId: number;
  filename: string;
}) {
  if (request.campaignId !== campaignId.value) {
    return;
  }

  await loadCampaignFiles();
}

async function loadCampaignFiles() {
  const getFilesResponse = await getCampaignFiles(campaignId.value || 0);
  files.value = getFilesResponse.data;
}

async function tryDeleteCampaignFile(fileId: number) {
  if (
    !confirm(
      'Are you sure you want to delete this file? Your campaign will no longer use this file for context or reference. This action cannot be undone.',
    )
  ) {
    return;
  }

  try {
    await deleteCampaignFile(campaignId.value || 0, fileId);
  } catch (error) {
    showError({
      message:
        'We encountered an error removing this file from your campaign. Please try again in a a few minutes. If the issue persists, please contact support.',
    });
  } finally {
    await loadCampaignFiles();
  }
}
</script>

<template>
  <div v-if="files.length" class="mt-4">
    <ul class="space-y-2">
      <div v-for="file in files" :key="file.id">
        <div class="text-neutral-300 rounded-md bg-neutral-800 p-3 w-fit flex">
          <div>{{ file.filename }}</div>
          <button
            class="ml-4 text-red-500"
            @click="tryDeleteCampaignFile(file.id)"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </ul>
  </div>
</template>
