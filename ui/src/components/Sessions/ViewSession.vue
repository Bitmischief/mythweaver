<script setup lang="ts">
import { ArrowLeftIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/solid';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  SessionBase,
  deleteSession,
  getSession,
  patchSession,
  postCompleteSession,
} from '@/api/sessions.ts';
import { useRoute, useRouter } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import Menu from '@/components/Core/General/Menu.vue';
import { MicrophoneIcon } from '@heroicons/vue/20/solid';
import { MenuButton, MenuItem } from '@headlessui/vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { useCurrentUserRole, useWebsocketChannel } from '@/lib/hooks.ts';
import CustomizableImage from '@/components/Images/CustomizableImage.vue';
import { useEventBus } from '@/lib/events.ts';
import RegeneratableTextEdit from '@/components/Core/Forms/RegeneratableTextEdit.vue';
import AudioUpload from '@/components/Core/Forms/AudioUpload.vue';
import ModalAlternate from '@/components/ModalAlternate.vue';
import AudioPlayback from '@/components/Core/General/AudioPlayback.vue';
import { CampaignRole } from '@/api/campaigns.ts';
import { debounce } from 'lodash';

const route = useRoute();
const router = useRouter();
const channel = useWebsocketChannel();
const eventBus = useEventBus();
const currentUserRole = useCurrentUserRole();

const session = ref<SessionBase>({} as SessionBase);
const loadingCompleteSession = ref(false);
const showUploadAudioModal = ref(false);

const sessionName = ref('');
const sessionImageUri = ref('');
const sessionSuggestedImagePrompt = ref('');

onMounted(async () => {
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

  channel.bind(ServerEvent.SessionImageUpdated, async function (data: any) {
    session.value.imageUri = data.imageUri;
    session.value.suggestedImageUri = data.suggestedImageUri;
  });
});

onUnmounted(() => {
  eventBus.$off('session-processing');
  eventBus.$off('session-summary-panel-updated');

  channel.unbind(ServerEvent.SessionUpdated);
  channel.unbind(ServerEvent.SessionImageUpdated);
});

watch(
  sessionName,
  debounce(async () => {
    if (sessionName.value === session.value.name) {
      return;
    }

    await saveSession('name');
  }, 250),
);

watch(
  sessionImageUri,
  debounce(async () => {
    if (sessionImageUri.value === session.value.imageUri) {
      return;
    }

    await saveSession('image');
  }, 250),
);

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );

  session.value = response.data as SessionBase;
  sessionName.value = session.value.name || '';
  sessionImageUri.value = session.value.imageUri || '';
  sessionSuggestedImagePrompt.value = session.value.suggestedImagePrompt || '';
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
    ...session.value,
    archived: false,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: 'Session unarchived successfully!' });
    await init();
  } else {
    showError({ message: 'Failed to unarchive session. Try again soon!' });
  }
}

async function saveSession(updated: string) {
  const putSessionResponse = await patchSession({
    id: session.value.id,
    campaignId: session.value.campaignId,
    name: sessionName.value,
    imageUri: sessionImageUri.value,
    suggestedImagePrompt: sessionSuggestedImagePrompt.value,
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: `Session ${updated} saved!` });
  } else {
    showError({ message: 'Failed to save session' });
  }
}

async function completeSession() {
  loadingCompleteSession.value = true;
  const putSessionResponse = await postCompleteSession(session.value.id);

  if (putSessionResponse.status !== 200) {
    showError({ message: 'Failed to complete session' });
  } else {
    showSuccess({
      message:
        'Session completed! You and your players will be emailed a session recap.',
    });

    await init();
  }
  loadingCompleteSession.value = false;
}

function handleAudioUpload(payload: { audioUri: string; audioName: string }) {
  session.value = {
    ...session.value,
    ...payload,
  };
  showUploadAudioModal.value = false;
}

const sessionType = computed(() => {
  if (session.value.completed) {
    return 'Completed';
  } else if (session.value.archived) {
    return 'Archived';
  } else if (session.value.planning || session.value.recap) {
    return 'In Progress';
  } else {
    return 'Upcoming';
  }
});
</script>

<template>
  <div v-if="session" class="min-h-[calc(100%-37rem)] py-2 pb-12">
    <div class="flex flex-wrap justify-between">
      <router-link :to="`/sessions`" class="button-primary flex">
        <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back to list
      </router-link>

      <div v-if="session.processing">
        <div
          class="animate-pulse mt-3 bg-amber-700 rounded-md px-3 text-white text-lg"
        >
          Processing...
        </div>
      </div>

      <div v-if="currentUserRole === CampaignRole.DM" class="flex">
        <button
          v-if="session.summary && !session.completed"
          class="button-ghost mr-2"
          :disabled="loadingCompleteSession"
          @click="completeSession"
        >
          <span v-if="loadingCompleteSession">Loading...</span>
          <span v-else>Mark Complete</span>
        </button>

        <AudioPlayback
          v-if="session.audioUri"
          class="self-center mt-3 md:mt-0 mx-auto mr-2"
          :audio-uri="session.audioUri"
        />
        <div
          v-else
          class="button-ghost flex mr-2"
          @click="showUploadAudioModal = true"
        >
          <MicrophoneIcon class="w-4 h-4 mr-1 self-center" />
          <span class="self-center">Upload Session Audio</span>
        </div>

        <Menu class="self-center w-[calc(100%-1.5rem)] ml-3 md:w-auto">
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

    <div class="mt-6">
      <div class="flex flex-wrap lg:flex-nowrap mb-12 justify-center">
        <div class="mb-4 mr-4">
          <CustomizableImage
            :editable="currentUserRole === CampaignRole.DM"
            :image-uri="sessionImageUri || '/images/session_bg_square.png'"
            :prompt="sessionSuggestedImagePrompt"
            class="rounded-md w-[20em]"
            :type="sessionType"
            @set-image="
              sessionImageUri = $event.imageUri;
              sessionSuggestedImagePrompt = $event.prompt;
            "
          />
        </div>
        <div class="grow">
          <RegeneratableTextEdit
            v-model="sessionName"
            :disabled="currentUserRole !== CampaignRole.DM"
            auto-height
            context="session"
            :background="{
              ...session,
              name: undefined,
            }"
            :disable-generation="!session.recap"
            input-class="text-xl"
            inner-class="border-none"
            outer-class="bg-surface-2 rounded-[8px]"
            hide-label
            label="Name"
            type="text"
          />

          <div class="bg-surface-2 rounded-[8px] p-4">
            <div class="flex align-center text-xl mb-2">
              <div>Summary</div>
              <div
                class="border border-fuchsia-500 rounded-full text-xs flex py-1 px-2 ml-2 flex"
              >
                <img
                  src="@/assets/icons/wand.svg"
                  alt="wand"
                  class="h-4 py-1 mr-1"
                />
                AI Generated
              </div>
            </div>
            <div
              v-if="session.summary"
              class="text-sm text-neutral-500 h-[14em] overflow-y-auto bg-surface-2 pr-2"
            >
              {{ session.summary }}
            </div>
            <div
              v-else
              class="text-sm text-neutral-500 text-center max-w-[20em] h-[12em] pt-[5em] mx-auto"
            >
              Summary will be avilable once this session is completed
            </div>
          </div>
        </div>
      </div>
      <div class="flex">
        <div
          class="flex w-full md:w-auto gap-1 text-neutral-500 rounded-[10px] bg-surface-2 p-1 border border-surface-3 text-sm"
        >
          <router-link
            to="planning"
            class="w-[33%] md:w-[12em] text-center py-2 px-4"
            :class="{
              'text-white rounded-[10px] bg-surface-3':
                route.path.endsWith('planning'),
            }"
          >
            Planning
          </router-link>
          <router-link
            to="recap"
            class="w-[33%] md:w-[12em] text-center py-2 px-4"
            :class="{
              'text-white rounded-[10px] bg-surface-3':
                route.path.endsWith('recap'),
            }"
          >
            GM's Recap
          </router-link>
          <router-link
            to="summary"
            class="w-[33%] md:w-[12em] text-center py-2 px-4"
            :class="{
              'text-white rounded-[10px] bg-surface-3':
                route.path.endsWith('summary'),
            }"
          >
            Summary
          </router-link>
        </div>
      </div>
    </div>

    <div class="mt-8 overflow-y-auto pb-6">
      <router-view />
    </div>

    <ModalAlternate
      :show="showUploadAudioModal"
      @close="showUploadAudioModal = false"
    >
      <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
        <AudioUpload :session="session" @audio-uploaded="handleAudioUpload" />
      </div>
    </ModalAlternate>
  </div>
</template>

<style scoped>
audio {
  width: 100%;
  margin-bottom: 2rem;
}
audio::-webkit-media-controls-panel {
  background: linear-gradient(
    to right,
    rgb(135, 27, 164, 0.75),
    rgba(217, 117, 244, 0.75),
    rgba(64, 170, 241, 0.75)
  );
}
input[type='file'] {
  display: none;
}
</style>
