<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getSessions, SessionBase } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import Session from '@/components/Sessions/Session.vue';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { AdjustmentsVerticalIcon, BoltIcon } from '@heroicons/vue/20/solid';

const eventBus = useEventBus();
const campaignStore = useCampaignStore();

const sessionsSearch = ref({
  offset: 0,
  limit: 25,
});
const sessions = ref<SessionBase[]>([]);
const loadMore = ref(false);

const currentUserRole = computed(() => campaignStore.selectedCampaignRole);

onMounted(async () => {
  await init();

  eventBus.$on('campaign-selected', async () => {
    await init();
  });
});

async function init() {
  sessions.value = [];
  await loadSessions();
}

async function loadSessions() {
  const getSessionsResponse = await getSessions({
    ...sessionsSearch.value,
  });

  sessions.value = getSessionsResponse.data.data;

  loadMore.value =
    getSessionsResponse.data.data.length === getSessionsResponse.data.limit;
}

async function loadMoreSessions() {
  sessionsSearch.value.offset += sessionsSearch.value.limit;
  await loadSessions();
}
</script>

<template>
  <div class="mb-6 w-full flex justify-between">
    <div class="text-3xl self-center">Sessions</div>

    <div class="flex">
      <router-link
        v-if="currentUserRole === CampaignRole.DM"
        to="/sessions/create"
        class="flex w-full self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
      >
        <BoltIcon class="mr-2 h-5 w-5 self-center" />
        <span class="self-center">Create</span>
      </router-link>
    </div>
  </div>

  <div class="mx-auto flex flex-wrap">
    <router-link
      v-for="(session, i) of sessions"
      :key="i"
      :to="`/sessions/${session.id}/edit`"
      class="mr-6"
    >
      <Session :session="session" :full="false" class="mb-6" />
    </router-link>
  </div>

  <div v-if="loadMore" class="mt-4 flex justify-center">
    <button
      class="rounded-xl bg-slate-800 p-2 px-10 text-lg"
      @click="loadMoreSessions"
    >
      Load more
    </button>
  </div>
</template>

<style scoped></style>
