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

async function checkForUpdates() {
  try {
    const response = await getVersion();
    const { version: latestVersion } = response.data;
    const currentVersion = import.meta.env.VITE_VERSION;

    showUpdateButton.value = latestVersion !== currentVersion;
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

function refreshPage() {
  window.location.reload();
}
</script>

<template>
  <Tooltip
  v-if="showUpdateButton" :text="tooltipText">
    <button
      class="flex items-center text-neutral-400 mr-2 border border-neutral-700 animate-pulse rounded-lg h-10 self-center px-4"
      @click="refreshPage"
    >
      <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
      Update Available
    </button>
  </Tooltip>
</template>
