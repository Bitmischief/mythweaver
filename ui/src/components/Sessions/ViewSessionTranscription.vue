<script lang="ts" setup>
import {
  getSessionTranscript,
  SessionBase,
  TranscriptParagraph,
} from '@/api/sessions.ts';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  useCurrentUserPlan,
  useUnsavedChangesWarning,
  useWebsocketChannel,
} from '@/lib/hooks.ts';
import { showError } from '@/lib/notifications.ts';
import { ArrowUpIcon } from '@heroicons/vue/24/outline';
import { CampaignRole } from '@/api/campaigns';
import { useCampaignStore } from '@/store/campaign.store';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Loader from '@/components/Core/Loader.vue';
import { BillingPlan } from '@/api/users.ts';
import axios from 'axios';
import SessionAudio from './ViewSessionAudio.vue';
import { useEventBus } from '@/lib/events';

const route = useRoute();

const campaignStore = useCampaignStore();
const currentUserRole = computed(() => campaignStore.selectedCampaignRole);
const originalSession = ref<SessionBase>({} as SessionBase);
const session = ref<SessionBase>({} as SessionBase);
const channel = useWebsocketChannel();
const eventBus = useEventBus();

withDefaults(
  defineProps<{
    readOnly?: boolean;
  }>(),
  {
    readOnly: false,
  },
);

useUnsavedChangesWarning(originalSession, session);

onMounted(async () => {
  window.addEventListener('scroll', setScroll, true);
  await init();
});

const sessionLoading = ref(true);
const transcript = ref<TranscriptParagraph[] | null>(null);

const showFullTranscript = ref(false);
const maxInitialLines = 50;

const visibleTranscript = computed(() => {
  if (!transcript.value) return [];

  return showFullTranscript.value
    ? transcript.value
    : transcript.value.slice(0, maxInitialLines);
});

const toggleFullTranscript = () => {
  showFullTranscript.value = !showFullTranscript.value;
};

async function init() {
  await loadTranscript();

  channel.bind(ServerEvent.TranscriptionStarted, transcriptionStartedHandler);
  channel.bind(ServerEvent.TranscriptionComplete, transcriptionCompleteHandler);
  channel.bind(ServerEvent.TranscriptionError, transcriptionErrorHandler);

  sessionLoading.value = false;
}

async function loadTranscript() {
  sessionLoading.value = true;
  try {
    const response = await getSessionTranscript(
      parseInt(route.params.sessionId.toString()),
    );

    transcript.value = response.data as TranscriptParagraph[];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      transcript.value = null;
    } else if (axios.isAxiosError(error) && error.response?.status === 400) {
      loadingTranscribeSession.value = true;
    } else {
      console.error('Error loading transcript:', error);
      showError({
        message: 'Failed to load transcript',
        context:
          'Please try again later or contact support if the problem persists',
      });
    }
  } finally {
    sessionLoading.value = false;
  }
}

async function transcriptionStartedHandler() {
  loadingTranscribeSession.value = true;

  await init();
}

async function transcriptionCompleteHandler() {
  await loadTranscript();
  loadingTranscribeSession.value = false;
}

async function transcriptionErrorHandler() {
  showError({
    message: 'Session transcription was not successful',
    context:
      'Please try again, if the problem persists please contact our support team',
  });
  loadingTranscribeSession.value = false;
}

onUnmounted(() => {
  window.removeEventListener('scroll', setScroll, true);
  channel.unbind(
    ServerEvent.TranscriptionComplete,
    transcriptionCompleteHandler,
  );
  channel.unbind(ServerEvent.TranscriptionStarted, transcriptionStartedHandler);
  channel.unbind(ServerEvent.TranscriptionError, transcriptionErrorHandler);
});

const setScroll = () => {
  const el = document.getElementById('transcription-title');
  transcriptionTitlePos.value = el?.getBoundingClientRect().y ?? 0;
};

const loadingTranscribeSession = ref(false);

function getTimestamp(milliseconds: number) {
  const seconds = milliseconds / 1000;
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds - h * 3600) / 60);
  let s = Math.floor(seconds - h * 3600 - m * 60);

  let hs = h.toString();
  let ms = m.toString();
  let ss = s.toString();

  if (h < 10) {
    hs = '0' + h;
  }
  if (m < 10) {
    ms = '0' + m;
  }
  if (s < 10) {
    ss = '0' + s;
  }

  return hs + ':' + ms + ':' + ss;
}

const currentAudioTime = ref(0);

const setCurrentAudioTime = (time: number) => {
  currentAudioTime.value = time;
};

const transcriptionTitlePos = ref(0);
const showScrollToTop = computed(() => {
  return transcriptionTitlePos.value < 0;
});

const scrollToTop = () => {
  document
    .getElementById('audio-player')
    ?.scrollIntoView({ behavior: 'smooth' });
};

// Add this new function to handle transcript line clicks
const handleTranscriptClick = (startTime: number) => {
  const timeInSeconds = startTime / 1000;
  setCurrentAudioTime(timeInSeconds);
  // Emit an event to update the audio player
  emit('seek', timeInSeconds);
};

// Add this emit declaration
const emit = defineEmits(['seek']);
</script>

<template>
  <div
    v-if="session && !sessionLoading"
    id="audio-player"
    class="bg-surface-2 rounded-[18px] min-h-[10em] pb-6 px-2 pt-2"
  >
    <div
      v-if="!session.audioUri"
      id="transcription-title"
      class="underline text-lg p-4 pb-0 mb-2"
    >
      Upload Audio
    </div>

    <SessionAudio
      v-if="currentUserRole"
      :current-user-role="currentUserRole"
      :read-only="readOnly"
      :current-time="currentAudioTime"
      @update:session="session = $event"
      @audio-uploaded="loadingTranscribeSession = true"
      @seek="setCurrentAudioTime"
    />

    <div id="transcription-title" class="underline text-lg p-4 pb-0">
      Transcript
    </div>
    <div v-if="transcript === null && !loadingTranscribeSession" class="p-4">
      No transcription is available for this session yet.
    </div>
    <div v-else-if="transcript && !loadingTranscribeSession" class="p-4">
      <div
        v-for="(s, i) in visibleTranscript"
        :key="`seg_${i}`"
        class="text-neutral-300 group hover:cursor-pointer flex mb-4"
        @click="handleTranscriptClick(s.start)"
      >
        <div
          class="text-xs mt-1 text-neutral-500 group-hover:text-violet-500 mr-4"
        >
          {{ getTimestamp(s.start) }}
        </div>
        <div
          class="group-hover:text-violet-500"
          :class="{
            'text-fuchsia-500': s.start / 1000 <= currentAudioTime,
          }"
        >
          {{ s.text }}
        </div>
      </div>

      <div
        v-if="useCurrentUserPlan().value !== BillingPlan.Pro"
        class="mt-8 rounded-xl text-center border-2 border-amber-600 bg-amber-500/25 font-bold cursor-pointer text-xl text-white p-2"
        @click="eventBus.$emit('show-subscription-modal')"
      >
        Upgrade to Pro to view the full transcript.
      </div>

      <button
        v-if="(transcript ?? []).length > maxInitialLines"
        class="mt-4 px-4 py-2 cursor-pointer bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
        @click="toggleFullTranscript"
      >
        {{ showFullTranscript ? 'Show Less' : 'Show Full Transcript' }}
      </button>
    </div>
    <div
      v-else-if="currentUserRole === CampaignRole.DM && !readOnly"
      class="p-4"
    >
      <div
        v-if="loadingTranscribeSession"
        class="text-lg text-neutral-400 mt-2"
      >
        <Loader />
        <div class="text-center mt-12">
          Your session is being transcribed, you can leave this page! Please
          note this process can take 5-10 minutes per hour of audio.
        </div>
      </div>
      <div
        v-if="session.sessionTranscription?.status === 'FAILED'"
        class="text-xs text-red-800 mt-2"
      >
        Something went wrong processing your transcription, please try again or
        contact support if the problem persists.
      </div>
    </div>
    <div v-else class="p-4">
      No transcription has been created for this session.
    </div>
  </div>
  <div v-else class="w-full flex justify-center mt-4">
    <Loader />
  </div>

  <div
    class="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none"
  >
    <button
      v-show="showScrollToTop"
      class="button-gradient text-xs flex pointer-events-auto"
      @click="scrollToTop"
    >
      <ArrowUpIcon class="h-4 w-4" />
      Scroll To Top
      <ArrowUpIcon class="h-4 w-4" />
    </button>
  </div>
</template>
