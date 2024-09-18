<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/vue/24/solid';
import { getVersion } from '@/api/versioning';

const showUpdateButton = ref(false);
const tooltipText = "Click to refresh the page and get the latest updates";

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
  <div class="relative group self-center">
    <button
      v-if="showUpdateButton"
      class="flex items-center text-neutral-400 mr-2 border border-neutral-700 animate-pulse rounded-lg h-10 self-center px-4"
      @click="refreshPage"
      :title="tooltipText"
    >
      <ArrowDownTrayIcon class="h-4 w-4 mr-1" />
      Update Available
    </button>
    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-neutral-800 text-neutral-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
      {{ tooltipText }}
    </div>
  </div>
</template>

<style scoped>
.group:hover .absolute {
  display: block;
}
</style>