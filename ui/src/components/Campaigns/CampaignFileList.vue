<script lang="ts" setup>
import { getCampaignFiles } from '@/api/campaigns.ts';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { onMounted, ref } from 'vue';

const campaignId = useSelectedCampaignId();
const files = ref([]);

onMounted(async () => {
  const getFilesResponse = await getCampaignFiles(campaignId.value || 0);
  files.value = getFilesResponse.data;
});
</script>

<template>
  <div v-if="files.length">
    <h2 class="text-lg font-semibold mb-4">Files</h2>
    <ul class="space-y-2">
      <li v-for="file in files" :key="file.id">
        <a :href="file.url" target="_blank" class="text-blue-500">{{
          file.filename
        }}</a>
      </li>
    </ul>
  </div>
</template>
