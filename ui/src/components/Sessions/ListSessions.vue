<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getSessions, postSession, SessionBase } from '@/api/sessions.ts';
import { useEventBus } from '@/lib/events.ts';
import Session from '@/components/Sessions/Session.vue';
import { useCampaignStore } from '@/store/campaign.store.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import { PlusIcon } from '@heroicons/vue/20/solid';
import { CalendarDaysIcon, UserGroupIcon } from '@heroicons/vue/24/outline';
import { showSuccess } from '@/lib/notifications.ts';
import { useRoute, useRouter } from 'vue-router';
import { useSelectedCampaignId } from '@/lib/hooks.ts';
import { format } from 'date-fns';

const selectedCampaignId = useSelectedCampaignId();
const eventBus = useEventBus();
const campaignStore = useCampaignStore();
const router = useRouter();
const route = useRoute();

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
  if (!selectedCampaignId.value) {
    await router.push('/campaigns/new');
  }

  // init
  await init();

  eventBus.$on('campaign-selected', async () => {
    await init();
  });
});

async function init() {
  sessions.value = [];

  if (route.hash === '#archived') {
    sessionsSearch.value.archived = true;
  } else {
    sessionsSearch.value.archived = undefined;
  }

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
  await router.push(`/sessions/${createSessionResponse.data.id}#plan`);
}

async function toggleArchived() {
  if (route.hash === '#archived') {
    await router.push({ hash: '' });
  } else {
    await router.push({ hash: '#archived' });
  }
  await init();
}

const planningSessions = computed(() => {
  if (sessions.value.length) {
    return sessions.value.filter(
      (session) => session.isOver === false && !session.completed,
    );
  }
  return [];
});

const needsRecapSessions = computed(() => {
  if (sessions.value.length) {
    return sessions.value.filter(
      (session) => session.isOver && !session.completed,
    );
  }
  return [];
});

const completedSessions = computed(() => {
  if (sessions.value.length) {
    return sessions.value.filter((session) => session.completed);
  }
  return [];
});
</script>

<template>
  <div class="flex w-full justify-between rounded-xl pb-4">
    <div class="w-full md:flex md:justify-between">
      <div class="text-xl self-center">
        <span class="gradient-text">Campaign Sessions</span>
        <span v-if="sessionsSearch.archived" class="text-neutral-500">
          | Archived
        </span>
      </div>

      <div class="mt-2 self-center md:mt-0 flex gap-2 justify-between">
        <button
          class="self-center text-neutral-400"
          :class="{
            'button-ghost-white': !sessionsSearch.archived,
            'button-ghost': sessionsSearch.archived,
          }"
          @click="toggleArchived"
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

  <div v-if="sessions.length">
    <div v-if="planningSessions.length" class="mb-6">
      <div class="flex mb-2">
        <div class="text-lg mx-2 text-neutral-300">
          {{ currentUserRole === CampaignRole.DM ? 'Planning' : 'Upcoming' }}
        </div>
        <hr class="border border-neutral-800 grow self-center" />
      </div>
      <div
        class="grid grid-cols-1 items-stretch sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-5"
      >
        <router-link
          v-for="(session, i) of planningSessions"
          :key="i"
          :to="`/sessions/${session.id}#plan`"
        >
          <div class="p-4 bg-surface-2 rounded-[12px]">
            <div class="text-neutral-200 truncate text-lg underline">
              {{ session.name }}
            </div>
            <div class="flex text-neutral-400">
              <CalendarDaysIcon class="h-5 mr-1" />
              <div>
                {{
                  session.date
                    ? format(new Date(session.date), 'MMM d, yyyy @ hh:mm a')
                    : 'TBD'
                }}
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <div v-if="needsRecapSessions.length" class="mb-6">
      <div class="flex mb-2">
        <div class="text-lg mx-2 text-neutral-300">
          {{ currentUserRole === CampaignRole.DM ? 'Needs Recap' : 'Recent' }}
        </div>
        <hr class="border border-neutral-800 grow self-center" />
      </div>
      <div
        class="grid grid-cols-1 items-stretch sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-5"
      >
        <router-link
          v-for="(session, i) of needsRecapSessions"
          :key="i"
          :to="`/sessions/${session.id}#recap`"
        >
          <div class="p-4 bg-surface-2 rounded-[12px]">
            <div class="truncate">{{ session.name }}</div>
            <div class="flex text-neutral-400">
              <CalendarDaysIcon class="h-5 mr-1" />
              <div>
                {{
                  session.date
                    ? format(new Date(session.date), 'MMM d, yyyy @ hh:mm a')
                    : 'TBD'
                }}
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <div v-if="completedSessions.length" class="mb-6">
      <div class="flex mb-2">
        <div class="text-lg mx-2 text-neutral-300">Completed</div>
        <hr class="border border-neutral-800 grow self-center" />
      </div>
      <div
        class="grid grid-cols-1 items-stretch sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-5"
      >
        <router-link
          v-for="(session, i) of completedSessions"
          :key="i"
          :to="`/sessions/${session.id}#overview`"
        >
          <Session class="h-full" :session="session" dense />
        </router-link>
      </div>
    </div>
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
