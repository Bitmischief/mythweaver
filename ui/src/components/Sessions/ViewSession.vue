<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EllipsisVerticalIcon,
  LockClosedIcon,
} from '@heroicons/vue/24/solid';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  deleteSession,
  getSession,
  patchSession,
  SessionBase,
} from '@/api/sessions.ts';
import { useRoute, useRouter } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
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
import { ConjurationRelationshipType } from '@/lib/enums.ts';
import { useLDFlag } from 'launchdarkly-vue-client-sdk';
import ViewSessionPlanning from '@/components/Sessions/ViewSessionPlanning.vue';
import ViewSessionRelationships from '@/components/Sessions/ViewSessionRelationships.vue';
import ViewSessionRecap from '@/components/Sessions/ViewSessionRecap.vue';
import ViewSessionTranscription from '@/components/Sessions/ViewSessionTranscription.vue';
import ViewSessionSummary from '@/components/Sessions/ViewSessionSummary.vue';
import { format } from 'date-fns';
import Spinner from '@/components/Core/Spinner.vue';
import { BillingPlan } from '@/api/users.ts';

const showRelationships = useLDFlag('relationships', false);

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

const checkRelationshipsFlag = async () => {
  if (!showRelationships.value && route.path.endsWith('relationships')) {
    await router.push(`/sessions/${sessionId.value}`);
  }
};

onMounted(async () => {
  await checkRelationshipsFlag();
  await init();

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

  channel.bind(ServerEvent.SessionUpdated, async function () {
    await init();
  });

  channel.bind(ServerEvent.SessionCompleted, async function () {
    await router.push({ hash: '#overview' });
    await init();
  });
});

onUnmounted(() => {
  eventBus.$off('session-summary-panel-updated');

  channel.unbind(ServerEvent.SessionUpdated);
});

watch(showRelationships, checkRelationshipsFlag);

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
      await router.push('/sessions');
    } else {
      showSuccess({ message: 'Session archived successfully!' });
      await init();
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

async function saveSession() {
  const putSessionResponse = await patchSession({
    id: session.value.id,
    campaignId: session.value.campaignId,
    name: sessionName.value,
    date: sessionDate.value,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: `Session saved!` });
  } else {
    showError({ message: 'Failed to save session' });
  }
}

async function handleCreateRelationship(type: ConjurationRelationshipType) {
  eventBus.$emit('create-relationship', {
    relationshipType: type,
    nodeId: session.value.id,
    nodeType: ConjurationRelationshipType.SESSION,
  });
}

async function sessionOver() {
  try {
    await patchSession({
      id: session.value.id,
      isOver: true,
    });
    showSuccess({ message: 'Session marked as over' });

    if (currentUserPlan.value === BillingPlan.Free) {
      await changeTab('recap');
    } else {
      await changeTab('transcription');
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
    await changeTab('overview');
  } catch {
    showError({ message: 'Failed to mark session as over' });
  }
}

async function changeTab(tabName: string) {
  tab.value = tabName;
  await router.push({ hash: `#${tabName}` });
}

const sessionHeaderEditable = computed(() => {
  return tab.value === 'plan';
});
</script>

<template>
  <div v-if="session" class="pb-12 relative">
    <div class="flex flex-wrap justify-between">
      <router-link :to="`/sessions`" class="button-primary flex self-center">
        <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back to list
      </router-link>

      <div
        v-if="currentUserRole === CampaignRole.DM"
        class="my-4 md:my-2 w-full md:w-auto"
      >
        <div v-if="session.processing" class="flex w-full justify-center mb-1">
          <Spinner class="mr-2 self-center" />
          <div class="self-center">Session summarization in progress...</div>
        </div>
        <div
          class="flex p-2 gap-4 border border-neutral-800 rounded-[20px] overflow-y-auto"
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
              }"
              :disabled="
                session.isOver === false || currentUserPlan === BillingPlan.Free
              "
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
              <div class="tooltip-arrow-top" data-popper-arrow></div>
            </div>
          </div>
          <ArrowRightIcon class="min-w-5 w-5 self-center" />
          <button
            class="basis-1/4 md:min-w-[120px]"
            :class="{
              'button-gradient': tab === 'recap',
              'button-primary': tab !== 'recap',
            }"
            :disabled="session.isOver === false"
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
            }"
            :disabled="!session.completed"
            @click="changeTab('overview')"
          >
            Overview
          </button>
        </div>
      </div>

      <div
        v-if="currentUserRole === CampaignRole.DM"
        class="flex gap-4 justify-end absolute top-0 right-0 md:static"
      >
        <button
          v-if="!session.completed && session.isOver === false"
          class="button-ghost self-center"
          @click="sessionOver"
        >
          Mark Session As Over
        </button>
        <button
          v-if="session.isOver && !session.completed"
          class="button-ghost self-center"
          @click="sessionComplete"
        >
          Mark Session As Complete
        </button>
        <Menu class="self-center">
          <MenuButton class="button-primary">
            <EllipsisVerticalIcon class="h-5" />
          </MenuButton>
          <template #content>
            <div class="relative z-60 bg-surface-3 p-2 rounded-[20px]">
              <MenuItem
                v-if="showRelationships && currentUserRole === CampaignRole.DM"
              >
                <button
                  class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200"
                  @click="
                    handleCreateRelationship(
                      ConjurationRelationshipType.CONJURATION,
                    )
                  "
                >
                  Link Conjurations
                </button>
              </MenuItem>
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
    <FormKit type="form" :actions="false" @submit="saveSession">
      <div class="md:mt-6 flex flex-wrap md:flex-nowrap gap-4 mb-4">
        <div :class="{ grow: sessionHeaderEditable }">
          <FormKit
            v-if="sessionHeaderEditable"
            v-model="sessionName"
            type="text"
            label="Session Name"
            input-class="md:text-xl"
            validation="required"
          />
          <div v-else class="text-xl text-neutral-200">
            <div class="text-neutral-400 text-xs">Session Name</div>
            {{ sessionName }}
          </div>
        </div>
        <div class="shrink">
          <FormKit
            v-if="sessionHeaderEditable"
            v-model="sessionDate"
            type="datetime-local"
            label="Session Date"
            input-class="md:text-xl"
            validation-visibility="live"
          />
          <div v-else class="text-xl text-neutral-200">
            <div class="text-neutral-400 text-xs">Session Date</div>
            {{ format(sessionDate, 'MMM d, yyyy @ h:mm a') }}
          </div>
        </div>
        <button
          v-if="tab === 'plan'"
          type="submit"
          class="button-gradient self-center"
        >
          Save
        </button>
      </div>
    </FormKit>

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
      <div class="mt-4 pb-6 mb-6 border border-neutral-800 rounded-[20px] p-4">
        <ViewSessionPlanning />
      </div>
      <div class="mt-4 pb-6 mb-12 border border-neutral-800 rounded-[20px] p-4">
        <div class="flex gap-4 justify-between">
          <div>Session Relationships</div>
          <Menu class="self-center">
            <MenuButton class="button-primary">
              <EllipsisVerticalIcon class="h-5" />
            </MenuButton>
            <template #content>
              <div class="relative z-60 bg-surface-3 p-2 rounded-[20px]">
                <MenuItem
                  v-if="
                    showRelationships && currentUserRole === CampaignRole.DM
                  "
                >
                  <button
                    class="w-full rounded-[14px] px-3 py-1 hover:bg-purple-800/20 hover:text-purple-200"
                    @click="
                      handleCreateRelationship(
                        ConjurationRelationshipType.CONJURATION,
                      )
                    "
                  >
                    Link Conjurations
                  </button>
                </MenuItem>
              </div>
            </template>
          </Menu>
        </div>
        <ViewSessionRelationships />
      </div>
    </div>
  </div>
</template>
