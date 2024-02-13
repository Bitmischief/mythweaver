<script lang="ts" setup>
import {
  getSession,
  postTranscriptionRequest,
  SessionBase,
} from '@/api/sessions.ts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useUnsavedChangesWarning } from '@/lib/hooks.ts';
import AudioPlayback from "@/components/Core/General/AudioPlayback.vue";
import {showError, showSuccess} from "@/lib/notifications.ts";
import {MicrophoneIcon} from "@heroicons/vue/20/solid";
import ModalAlternate from "@/components/ModalAlternate.vue";
import AudioUpload from "@/components/Core/Forms/AudioUpload.vue";

const route = useRoute();

const originalSession = ref<SessionBase>({} as SessionBase);
const session = ref<SessionBase>({} as SessionBase);
const showUploadAudioModal = ref(false);

useUnsavedChangesWarning(originalSession, session);

onMounted(async () => {
  await init();
});

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  originalSession.value = response.data as SessionBase;
  session.value = { ...originalSession.value };
  if (response.data.sessionTranscription && response.data.sessionTranscription.status === 'PROCESSING')
  {
    loadingTranscribeSession.value = true;
  }
}

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
  } else {
    showSuccess({
      message:
        'Session transcription is in progress!',
      context:
        'This process can take 10-20 minutes depending on the length of your session.'
    });

    await init();
  }
}

function getTimestamp(seconds: number) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds - (h * 3600)) / 60);
  let s = seconds - (h * 3600) - (m * 60);

  let hs = h.toString();
  let ms = m.toString();
  let ss = s.toString();

  if (h < 10) { hs = "0"+h; }
  if (m < 10) { ms = "0"+m; }
  if (s < 10) { ss = "0"+s; }

  return hs+':'+ms+':'+ss;
}
</script>

<template>
  <div class="bg-surface-2 rounded-[18px] min-h-[10em] py-6 px-2">
    <div class="bg-surface rounded-full flex justify-start p-4">
      <button v-if="!session.sessionTranscription && !!session.audioUri" class="button-gradient mr-2" :disabled="!session.audioUri || loadingTranscribeSession" @click="requestTranscription">
        {{
          loadingTranscribeSession ? 'Transcribing session...' : 'Transcribe'
        }}
      </button>
      <AudioPlayback
        v-if="session.audioUri"
        class="self-center"
        :audio-uri="session.audioUri"
        start="00:01:00"
      />
      <div
        v-else
        class="button-ghost flex mr-2"
        @click="showUploadAudioModal = true"
      >
        <MicrophoneIcon class="w-4 h-4 mr-1 self-center" />
        <span class="self-center">Upload Session Audio</span>
      </div>
    </div>

    <div v-if="session.sessionTranscription" class="p-4">
      <div class="underline">Transcription</div>
      <div v-for="(s,i) in session.sessionTranscription.transcription.segments" :key="`seg_${i}`" class="text-neutral-300  hover:text-fuchsia-500">
        <span>{{ getTimestamp(s.start) }} - {{ getTimestamp(s.end) }}:</span>{{ s.text }}
      </div>
    </div>
  </div>
  <ModalAlternate
    :show="showUploadAudioModal"
    @close="showUploadAudioModal = false"
  >
    <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <AudioUpload :session="session" @audio-uploaded="handleAudioUpload" />
    </div>
  </ModalAlternate>
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
