<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ArrowDownTrayIcon } from '@heroicons/vue/24/solid';
import { getVersion } from '@/api/versioning';
import Tooltip from './Tooltip.vue';

const showUpdateButton = ref(false);
const tooltipText = 'Click to refresh the page and get the latest updates';

onMounted(() => {
  checkForUpdates();
  // Check for updates every 5 minutes
  setInterval(checkForUpdates, 5 * 60 * 1000);
});

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1?.split('.').map(Number);
  const parts2 = v2?.split('.').map(Number);

  if (parts1 && parts2) {
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }
  }

  return 0;
}

async function checkForUpdates() {
  try {
    const response = await getVersion();
    const { version: latestVersion } = response.data;
    const currentVersion = import.meta.env.VITE_VERSION;

    showUpdateButton.value = compareVersions(latestVersion, currentVersion) > 0;
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

function refreshPage() {
  window.location.reload();
}
</script>

<template>
  <div v-if="showUpdateButton" class="self-center">
    <Tooltip :text="tooltipText">
      <button
        class="flex items-center text-neutral-400 mr-2 border border-neutral-700 animate-pulse rounded-lg h-10 self-center px-4"
        @click="refreshPage"
      >
        <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
        Update Available
      </button>
    </Tooltip>
  </div>
</template>
