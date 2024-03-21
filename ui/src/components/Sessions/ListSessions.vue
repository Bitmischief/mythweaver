<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getSessions, postSession, SessionBase } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import Session from '@/components/Sessions/Session.vue';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { PlusIcon } from '@heroicons/vue/20/solid';
import { UserGroupIcon } from '@heroicons/vue/24/outline';
import { showSuccess } from '@/lib/notifications.ts';
import { useRouter } from 'vue-router';

const eventBus = useEventBus();
const campaignStore = useCampaignStore();
const router = useRouter();

const sessionsSearch = ref<{
  offset: number;
  limit: number;
  archived: boolean | undefined;
}>({
  offset: 0,
  limit: 25,
  archived: undefined,
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
  await router.push(`/sessions/${createSessionResponse.data.id}/relationships`);
}
</script>

<template>
  <div class="mb-6 flex w-full justify-between rounded-xl py-4">
    <div class="w-full md:flex md:justify-between">
      <div class="text-xl self-center font-bold">Sessions</div>

      <div class="mt-2 self-center md:mt-0 flex gap-2 justify-between">
        <button
          class="self-center button-primary"
          @click="
            sessionsSearch.archived =
              sessionsSearch.archived === undefined ? true : undefined;
            init();
          "
        >
          <span v-if="!sessionsSearch.archived" class="self-center"
            >View Archived</span
          >
          <span v-else class="self-center">View All</span>
        </button>
        <button
          v-if="currentUserRole === CampaignRole.DM"
          class="flex justify-center self-center button-ghost"
          @click="handleCreateSession"
        >
          <PlusIcon class="mr-2 h-5 w-5 self-center" />
          <span class="self-center">Create session</span>
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="sessions.length"
    class="grid grid-cols-1 place-items-stretch sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
  >
    <router-link
      v-for="(session, i) of sessions"
      :key="i"
      :to="`/sessions/${session.id}/relationships`"
    >
      <Session :session="session" :full="false" />
    </router-link>
  </div>
  <div v-else class="flex justify-center h-full">
    <div class="flex flex-col justify-center text-center">
      <div>
        <UserGroupIcon class="h-14 text-neutral-500 mx-auto" />
      </div>
      <div class="self-center text-2xl my-4">
        No sessions have been
        {{ sessionsSearch.archived ? 'archived' : 'created' }} for this campaign
        yet.
      </div>
      <div
        v-if="currentUserRole === CampaignRole.DM && !sessionsSearch.archived"
        class="text-neutral-500 mb-8 max-w-[40em]"
      >
        Session you create for selected campaign will appear on this screen. Try
        creating your first session using the button below.
      </div>
      <div
        v-else-if="
          currentUserRole !== CampaignRole.DM && !sessionsSearch.archived
        "
        class="text-neutral-500 mb-8 max-w-[40em]"
      >
        Sessions your GM creates for your campaign will appear on this screen.
        Check back here again after your GM creates your fist session.
      </div>
      <button
        v-if="currentUserRole === CampaignRole.DM && !sessionsSearch.archived"
        class="flex justify-center self-center button-gradient"
        @click="handleCreateSession"
      >
        <PlusIcon class="mr-2 h-5 w-5 self-center" />
        <span class="self-center">Create session</span>
      </button>
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
