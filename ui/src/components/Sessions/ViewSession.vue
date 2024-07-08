<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EllipsisVerticalIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/solid';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  deleteSession,
  getSession,
  patchSession,
  SessionBase,
} from '@/api/sessions.ts';
import { useRoute, useRouter } from 'vue-router';
import { showError, showInfo, showSuccess } from '@/lib/notifications.ts';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import {
  useCurrentUserPlan,
  useCurrentUserRole,
  useWebsocketChannel,
} from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import { CampaignRole } from '@/api/campaigns.ts';
import ViewSessionPlanning from '@/components/Sessions/ViewSessionPlanning.vue';
import ViewSessionRecap from '@/components/Sessions/ViewSessionRecap.vue';
import ViewSessionTranscription from '@/components/Sessions/ViewSessionTranscription.vue';
import ViewSessionSummary from '@/components/Sessions/ViewSessionSummary.vue';
import { format } from 'date-fns';
import Spinner from '@/components/Core/Spinner.vue';
import { BillingPlan } from '@/api/users.ts';

const route = useRoute();
const router = useRouter();
const channel = useWebsocketChannel();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();
const currentUserPlan = useCurrentUserPlan();

const session = ref<SessionBase>({} as SessionBase);

const sessionName = ref('');
const sessionId = computed(() => parseInt(route.params.sessionId.toString()));
const sessionDate = ref();
const tab = ref();
const showAudio = ref(false);

onMounted(async () => {
  eventBus.$on('session-processing', (payload: { recap: string }) => {
    session.value.processing = true;
    session.value.recap = payload.recap;
  });

  eventBus.$on('session-summary-panel-updated', async (data: any) => {
    session.value.summary = data.summary;
    session.value.recap = data.recap;
    session.value.suggestions = data.suggestions;
    session.value.processing = data.processing;

    await router.push('summary');
  });

  channel.bind(ServerEvent.SessionUpdated, sessionUpdatedHandler);
  channel.bind(ServerEvent.SessionCompleted, sessionCompletedHandler);

  await init();
});

async function sessionUpdatedHandler() {
  await init();
}

async function sessionCompletedHandler() {
  await router.push({ hash: '#overview' });
  await init();
}

onUnmounted(() => {
  eventBus.$off('session-summary-panel-updated');
  channel.unbind(ServerEvent.SessionUpdated, sessionUpdatedHandler);
  channel.unbind(ServerEvent.SessionCompleted, sessionCompletedHandler);
});

async function init() {
  const response = await getSession(sessionId.value);

  session.value = response.data as SessionBase;
  sessionName.value = session.value.name || '';

  if (session.value.date) {
    sessionDate.value = format(session.value.date, "yyyy-MM-dd'T'HH:mm");
  }

  if (currentUserRole.value === CampaignRole.Player) {
    await changeTab('overview');
  } else {
    if (route.hash) {
      switch (route.hash) {
        case '#plan':
          tab.value = 'plan';
          break;
        case '#transcript':
          tab.value = 'transcript';
          break;
        case '#recap':
          tab.value = 'recap';
          break;
        case '#overview':
          tab.value = 'overview';
          break;
        default:
          tab.value = 'plan';
          break;
      }
    } else if (session.value.isOver) {
      if (session.value.completed) {
        tab.value = 'overview';
      } else {
        tab.value = 'recap';
      }
    } else {
      tab.value = 'plan';
    }
  }
}

async function clickDeleteSession() {
  if (
    !confirm(
      `Are you sure you want to ${
        session.value.archived ? 'delete' : 'archive'
      } this session?`,
    )
  ) {
    return;
  }

  const deleteSessionResponse = await deleteSession(session.value.id);

  if (deleteSessionResponse.status === 200) {
    if (session.value.archived) {
      showSuccess({ message: 'Session deleted successfully!' });
      await router.push('/sessions#archived');
    } else {
      showSuccess({ message: 'Session archived successfully!' });
      await router.push('/sessions');
    }
  } else {
    showError({ message: 'Failed to delete session. Try again soon!' });
  }
}

async function clickUnarchiveSession() {
  const putSessionResponse = await patchSession({
    id: session.value.id,
    archived: false,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: 'Session unarchived successfully!' });
    await init();
  } else {
    showError({ message: 'Failed to unarchive session. Try again soon!' });
  }
}

async function sessionOver() {
  try {
    await patchSession({
      id: session.value.id,
      isOver: true,
    });
    session.value.isOver = true;
    showSuccess({ message: 'Session marked as over' });

    if (currentUserPlan.value === BillingPlan.Free) {
      await changeTab('recap');
    } else {
      await changeTab('transcript');
    }
  } catch {
    showError({ message: 'Failed to mark session as over' });
  }
}

async function sessionComplete() {
  try {
    await patchSession({
      id: session.value.id,
      completed: true,
    });
    showSuccess({ message: 'Session marked as complete' });
    await init();
    await changeTab('overview');
  } catch {
    showError({ message: 'Failed to mark session as over' });
  }
}

const pingSessionOverButton = ref(false);
const pingSessionCompleteButton = ref(false);

async function changeTab(tabName: string) {
  if (tabName === 'transcript' && currentUserPlan.value === BillingPlan.Free) {
    showInfo({
      message: 'You must have a paid plan to access this feature.',
      timeout: 2000,
      position: 'center',
    });
    return;
  } else if (
    (tabName === 'recap' || tabName === 'transcript') &&
    !session.value.isOver
  ) {
    showInfo({
      message: 'You must mark the session as over first.',
      timeout: 2000,
      position: 'center',
    });
    pingSessionOverButton.value = true;
    setTimeout(() => {
      pingSessionOverButton.value = false;
    }, 500);
    return;
  } else if (tabName === 'overview' && !session.value.completed) {
    showInfo({
      message: 'You must mark the session as complete first.',
      timeout: 2000,
      position: 'center',
    });
    pingSessionCompleteButton.value = true;
    setTimeout(() => {
      pingSessionCompleteButton.value = false;
    }, 500);
    return;
  }
  tab.value = tabName;
  await router.push({ hash: `#${tabName}` });
}

const back = () => {
  if (route.query.from) {
    router.push(route.query.from.toString());
  } else {
    router.push('/sessions');
  }
};

const next = () => {
  if (tab.value === 'plan') {
    changeTab('transcript');
  } else if (tab.value === 'transcript') {
    changeTab('recap');
  } else if (tab.value === 'recap') {
    changeTab('overview');
  }
};
</script>

<template>
  <div v-if="session" class="pb-12 relative">
    <div class="flex flex-wrap justify-between">
      <button class="button-primary flex self-center" @click="back">
        <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" />
        Campaign Sessions
      </button>

      <div
        v-if="currentUserRole === CampaignRole.DM"
        class="my-4 md:my-2 w-full md:w-auto"
      >
        <div v-if="session.processing" class="flex w-full justify-center mb-1">
          <Spinner class="mr-2 self-center" />
          <div class="self-center">Session summarization in progress...</div>
        </div>
        <div
          class="flex flex-wrap md:flex-nowrap p-2 gap-4 border border-neutral-800 rounded-[20px]"
        >
          <button
            class="basis-1/4 md:min-w-[120px]"
            :class="{
              'button-gradient': tab === 'plan',
              'button-primary': tab !== 'plan',
            }"
            @click="changeTab('plan')"
          >
            Plan
          </button>
          <ArrowRightIcon class="min-w-5 w-5 self-center" />
          <div class="basis-1/4 md:min-w-[120px] relative group/transcript">
            <button
              class="flex w-full gap-2 justify-center"
              :class="{
                'button-gradient': tab === 'transcript',
                'button-primary': tab !== 'transcript',
                'opacity-50':
                  session.isOver === false ||
                  currentUserPlan === BillingPlan.Free,
              }"
              @click="changeTab('transcript')"
            >
              Transcript
              <LockClosedIcon
                v-if="currentUserPlan === BillingPlan.Free"
                class="h-4 w-4 self-center"
              />
            </button>
            <div
              v-if="currentUserPlan === BillingPlan.Free"
              class="tooltip-bottom my-2 group-hover/transcript:block"
            >
              You must have a paid plan to access this feature.
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>
          </div>
          <ArrowRightIcon class="min-w-5 w-5 self-center" />
          <button
            class="basis-1/4 md:min-w-[120px]"
            :class="{
              'button-gradient': tab === 'recap',
              'button-primary': tab !== 'recap',
              'opacity-50': session.isOver === false,
            }"
            @click="changeTab('recap')"
          >
            Recap
          </button>
          <ArrowRightIcon class="min-w-5 w-5 self-center" />
          <button
            class="basis-1/4 md:min-w-[120px]"
            :class="{
              'button-gradient': tab === 'overview',
              'button-primary': tab !== 'overview',
              'opacity-50': !session.completed,
            }"
            @click="changeTab('overview')"
          >
            Overview
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <div
          v-if="currentUserRole === CampaignRole.DM"
          class="flex gap-4 justify-end self-center"
        >
          <div
            v-if="!session.completed && session.isOver === false"
            class="self-center"
          >
            <button
              class="button-ghost self-center flex gap-2"
              :class="{ 'purple-pulse': pingSessionOverButton }"
              @click="sessionOver"
            >
              Mark Session As Over
              <ArrowRightIcon class="min-w-5 w-5 self-center" />
            </button>
          </div>
          <div
            v-else-if="session.isOver && !session.completed && tab === 'recap'"
            class="self-center"
          >
            <button
              class="button-ghost flex"
              :class="{ 'purple-pulse': pingSessionCompleteButton }"
              @click="sessionComplete"
            >
              Mark Session As Complete
              <ArrowRightIcon class="min-w-5 w-5 self-center" />
            </button>
          </div>
          <div v-else-if="tab !== 'overview'">
            <button>
              <button class="button-ghost flex" @click="next">
                Next
                <ArrowRightIcon class="min-w-5 w-5 self-center" />
              </button>
            </button>
          </div>
        </div>
        <div
          v-if="currentUserRole === CampaignRole.DM"
          class="flex gap-4 justify-end absolute top-0 right-0 md:static"
        >
          <Menu class="self-center">
            <MenuButton class="button-primary">
              <EllipsisVerticalIcon class="h-5" />
            </MenuButton>
            <template #content>
              <div class="relative z-60 bg-surface-3 p-2 rounded-[20px]">
                <MenuItem v-if="!session.archived">
                  <button
                    class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200"
                    @click="clickDeleteSession"
                  >
                    Archive session
                  </button>
                </MenuItem>
                <template v-else>
                  <MenuItem>
                    <button
                      class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200"
                      @click="clickUnarchiveSession"
                    >
                      Unarchive session
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200"
                      @click="clickDeleteSession"
                    >
                      Delete session
                    </button>
                  </MenuItem>
                </template>
              </div>
            </template>
          </Menu>
        </div>
      </div>
    </div>
    <div
      v-if="tab !== 'plan'"
      class="md:mt-6 flex flex-wrap md:flex-nowrap gap-4 mb-4"
    >
      <div class="text-xl text-neutral-200">
        <div class="text-neutral-400 text-xs">Session Name</div>
        {{ sessionName }}
      </div>
      <div class="text-xl text-neutral-200">
        <div class="text-neutral-400 text-xs">Session Date</div>
        {{ sessionDate ? format(sessionDate, 'MMM d, yyyy @ h:mm a') : 'TBD' }}
      </div>
    </div>
    <div v-if="tab === 'overview'">
      <ViewSessionSummary />
    </div>
    <div v-if="tab === 'transcript'" class="flex justify-center">
      <div
        v-if="!session.audioUri && !showAudio"
        class="w-full text-lg bg-surface-2 px-12 py-6 rounded-[20px] text-center"
      >
        <div>Do you have an audio recording of your session?</div>
        <div class="text-sm text-neutral-400 py-2">
          Uploading a recording of your session allows MythWeaver to generate
          audio transcriptions and automatic session recaps.
        </div>
        <div class="flex gap-4 justify-center mt-4">
          <div>
            <button
              class="button-primary min-w-[5em]"
              @click="changeTab('recap')"
            >
              No
            </button>
          </div>
          <div>
            <button
              class="button-gradient min-w-[5em]"
              @click="showAudio = true"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
      <div
        v-else
        class="mt-4 pb-6 mb-6 border border-neutral-800 rounded-[20px] p-4 grow"
      >
        <div>Session Audio & Transcription</div>
        <div v-if="!session.audioUri" class="text-xs text-neutral-400 mb-2">
          If you have a recording of your session you can upload it here.
          MythWeaver can then transcribe the audio for you and produce an
          automatic session recap in the next step.
        </div>
        <ViewSessionTranscription />
      </div>
    </div>
    <div v-if="tab === 'recap'">
      <div class="mt-4 pb-6 mb-6 border border-neutral-800 rounded-[20px] p-4">
        <div class="text-sm text-neutral-400 mb-2">
          Add a recap of the session. This will be visible to your players.
        </div>
        <ViewSessionRecap />
      </div>
    </div>
    <div v-if="tab === 'plan'">
      <div class="mt-4">
        <ViewSessionPlanning />
      </div>
    </div>
  </div>
</template>
