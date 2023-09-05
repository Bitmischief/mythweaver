<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getSessions, SessionBase } from "@/api/sessions.ts";
import { useEventBus } from "@/lib/events.ts";
import Session from "@/components/Sessions/Session.vue";
import { useCampaignStore } from "@/store/campaign.store.ts";
import { CampaignRole } from "@/api/campaigns.ts";

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

  eventBus.$on("campaign-selected", async () => {
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
  <div v-if="sessions.length === 0">
    <div class="text-2xl">No sessions found!</div>

    <router-link
      v-if="currentUserRole === CampaignRole.DM"
      to="/sessions/create"
    >
      <button
        class="mt-8 flex cursor-pointer rounded-xl bg-black bg-gradient px-4 py-2 text-lg font-bold text-white"
      >
        <span class="self-center"> Add New Session </span>
      </button>
    </router-link>
  </div>
  <div v-else>
    <div class="grid grid-cols-1 gap-8 md:grid-cols-4">
      <router-link
        v-for="(session, i) of sessions"
        :key="i"
        :to="`/sessions/${session.id}/edit`"
      >
        <Session :session="session" :full="false" />
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
  </div>
</template>

<style scoped></style>
