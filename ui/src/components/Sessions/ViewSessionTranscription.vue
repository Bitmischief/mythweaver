<script lang="ts" setup>
import {
  getSession,
  postTranscriptionRequest,
  SessionBase,
} from '@/api/sessions.ts';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUnsavedChangesWarning, useWebsocketChannel } from '@/lib/hooks.ts';
import AudioPlayback from '@/components/Core/General/AudioPlayback.vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { MicrophoneIcon } from '@heroicons/vue/20/solid';
import { ArrowUpIcon } from '@heroicons/vue/24/outline';
import ModalAlternate from '@/components/ModalAlternate.vue';
import AudioUpload from '@/components/Core/Forms/AudioUpload.vue';
import { CampaignRole } from '@/api/campaigns';
import { useCampaignStore } from '@/store/campaign.store';
import Spinner from '@/components/Core/Spinner.vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import Loader from '@/components/Core/Loader.vue';

const route = useRoute();

const campaignStore = useCampaignStore();
const currentUserRole = computed(() => campaignStore.selectedCampaignRole);
const originalSession = ref<SessionBase>({} as SessionBase);
const session = ref<SessionBase>({} as SessionBase);
const showUploadAudioModal = ref(false);
const channel = useWebsocketChannel();

useUnsavedChangesWarning(originalSession, session);

onMounted(async () => {
  window.addEventListener('scroll', setScroll, true);
  await init();
});

const sessionLoading = ref(true);

async function init() {
  sessionLoading.value = true;
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  originalSession.value = response.data as SessionBase;
  session.value = { ...originalSession.value };
  if (
    response.data.sessionTranscription !== null &&
    response.data.sessionTranscription.status === 'PROCESSING'
  ) {
    loadingTranscribeSession.value = true;
  }

  channel.bind(ServerEvent.TranscriptionStarted, async function () {
    showSuccess({
      message: 'Session transcription is in progress!',
      context:
        'This process can take 10-20 minutes depending on the length of your session.',
    });
    loadingTranscribeSession.value = true;

    await init();
  });

  channel.bind(ServerEvent.TranscriptionComplete, async function () {
    const response = await getSession(
      parseInt(route.params.sessionId.toString()),
    );

    session.value = {
      ...session.value,
      sessionTranscription: response.data.sessionTranscription,
    };
    originalSession.value = { ...session.value };

    loadingTranscribeSession.value = false;
  });

  channel.bind(ServerEvent.TranscriptionError, async function () {
    showError({
      message: 'Session transcription was not successful',
      context:
        'Please try again, if the problem persists please contact our support team',
    });
    loadingTranscribeSession.value = false;
  });

  sessionLoading.value = false;
}

onUnmounted(() => {
  window.removeEventListener('scroll', setScroll, true);
  channel.unbind(ServerEvent.TranscriptionComplete);
  channel.unbind(ServerEvent.TranscriptionStarted);
  channel.unbind(ServerEvent.TranscriptionError);
});

const setScroll = () => {
  const el = document.getElementById('transcription-title');
  transcriptionTitlePos.value = el?.getBoundingClientRect().y ?? 0;
};

function handleAudioUpload(payload: { audioUri: string; audioName: string }) {
  session.value = {
    ...session.value,
    ...payload,
  };
  showUploadAudioModal.value = false;
}

const loadingTranscribeSession = ref(false);
async function requestTranscription() {
  loadingTranscribeSession.value = true;
  const response = await postTranscriptionRequest(session.value.id);

  if (response.status !== 200) {
    showError({ message: 'Failed to request transcription' });
    loadingTranscribeSession.value = false;
  }
}

function getTimestamp(seconds: number) {
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

const startSeconds = ref(0);
const currentAudioTime = ref(-1);

const setCurrentAudioTime = (time: number) => {
  currentAudioTime.value = time;
};

const jumpToCurrent = () => {
  const el = document.querySelectorAll('.audio-read');
  if (el.length) {
    el[el.length - 1].scrollIntoView({ behavior: 'smooth' });
  }
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
</script>

<template>
  <div
    v-if="session && !sessionLoading"
    id="audio-player"
    class="bg-surface-2 rounded-[18px] min-h-[10em] py-6 px-2"
  >
    <div class="bg-surface rounded-[18px] flex justify-start p-4">
      <AudioPlayback
        v-if="session.audioUri"
        class="self-center"
        :audio-name="session.audioName"
        :audio-uri="session.audioUri"
        :start="startSeconds"
        :has-transcription="
          !!session.sessionTranscription?.transcription ?? false
        "
        @seek="setCurrentAudioTime"
        @jump="jumpToCurrent"
      />
      <div
        v-else-if="currentUserRole === CampaignRole.DM"
        class="button-ghost flex mr-2"
        @click="showUploadAudioModal = true"
      >
        <MicrophoneIcon class="w-4 h-4 mr-1 self-center" />
        <span class="self-center">Upload Session Audio</span>
      </div>
      <div v-else>No audio has been uploaded for this session.</div>
    </div>

    <div id="transcription-title" class="underline text-lg p-4 pb-0">
      Transcription
    </div>
    <div v-if="session.sessionTranscription?.transcription" class="p-4">
      <div
        v-for="(s, i) in session.sessionTranscription.transcription.segments"
        :key="`seg_${i}`"
        class="text-neutral-300 group hover:cursor-pointer flex mb-4"
        @click="startSeconds = s.start"
      >
        <div
          class="text-xs mt-1 text-neutral-500 group-hover:text-violet-500 mr-4"
        >
          {{ getTimestamp(s.start) }}
        </div>
        <div
          class="group-hover:text-violet-500"
          :class="{
            'text-fuchsia-500 audio-read': s.start <= currentAudioTime,
          }"
        >
          {{ s.text }}
        </div>
      </div>
    </div>
    <div v-else-if="currentUserRole === CampaignRole.DM" class="p-4">
      <button
        class="button-gradient mr-2"
        :disabled="!session.audioUri || loadingTranscribeSession"
        @click="requestTranscription"
      >
        <div v-if="loadingTranscribeSession" class="flex">
          <Spinner />
          Transcribing session...
        </div>
        <div v-else>Transcribe session</div>
      </button>
      <div
        v-if="loadingTranscribeSession"
        class="text-xs text-neutral-400 mt-2"
      >
        Your transcription is loading, please note this process can take 10-20
        minutes for a 2-4 hour long session.
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
  <ModalAlternate
    :show="showUploadAudioModal"
    @close="showUploadAudioModal = false"
  >
    <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <AudioUpload :session="session" @audio-uploaded="handleAudioUpload" />
    </div>
  </ModalAlternate>

  <div
    class="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none"
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

<style>
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
