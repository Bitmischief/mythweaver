<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getSessions, postSession, SessionBase } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import Session from '@/components/Sessions/Session.vue';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { BoltIcon } from '@heroicons/vue/20/solid';
import { showSuccess } from '@/lib/notifications.ts';
import { useRouter } from 'vue-router';

const eventBus = useEventBus();
const campaignStore = useCampaignStore();
const router = useRouter();

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

async function handleCreateSession() {
  const createSessionResponse = await postSession({});

  showSuccess({ message: 'Session created!' });
  await router.push(`/sessions/${createSessionResponse.data.id}/planning`);
}
</script>

<template>
  <div class="mb-6 flex w-full justify-between rounded-xl py-4">
    <div class="w-full md:flex md:justify-between">
      <div class="text-2xl self-center font-bold">Sessions List</div>

      <div class="mt-2 self-center md:mt-0 flex justify-between">
        <button
          v-if="currentUserRole === CampaignRole.DM"
          class="flex w-full self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="handleCreateSession"
        >
          <BoltIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Create</span>
        </button>
      </div>
    </div>
  </div>

  <div v-if="sessions.length" class="flex flex-wrap">
    <router-link
      v-for="(session, i) of sessions"
      :key="i"
      :to="`/sessions/${session.id}/planning`"
      class="mr-6"
    >
      <Session :session="session" :full="false" class="mb-6" />
    </router-link>
  </div>
  <div v-else>
    <div
      class="min-h-[10rem] flex justify-center text-center text-xl text-gray-500 divider"
    >
      <div class="self-center">
        No sessions have been created in this campaign!
      </div>
    </div>
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
