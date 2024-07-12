<script lang="ts" setup>
import { deleteCampaignFile, getCampaignFiles } from '@/api/campaigns.ts';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { onMounted, ref } from 'vue';
import { TrashIcon } from '@heroicons/vue/24/solid';
import { showError } from '@/lib/notifications.ts';

const campaignId = useSelectedCampaignId();
const files = ref([]);

onMounted(async () => {
  await loadCampaignFiles();
});

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
  <div v-if="files.length">
    <h2 class="text-lg font-semibold mb-4">Files</h2>
    <ul class="space-y-2">
      <div v-for="file in files" :key="file.id">
        <div class="text-neutral-700 rounded-md bg-neutral-300 p-3 w-fit flex">
          <div>{{ file.filename }}</div>
          <button
            class="ml-4 text-red-600"
            @click="tryDeleteCampaignFile(file.id)"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </ul>
  </div>
</template>
