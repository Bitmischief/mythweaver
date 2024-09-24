<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { deleteSessionAudio, SessionBase, getSession } from '@/api/sessions.ts';
import AudioPlayback from '@/components/Core/General/AudioPlayback.vue';
import { TrashIcon, MicrophoneIcon } from '@heroicons/vue/20/solid';
import ModalAlternate from '@/components/ModalAlternate.vue';
import AudioUpload from '@/components/Core/Forms/AudioUpload.vue';
import { CampaignRole } from '@/api/campaigns';
import { showUpgradeModal, useHasValidPlan } from '@/lib/hooks.ts';
import { BillingPlan } from '@/api/users.ts';

defineProps<{
  currentUserRole: CampaignRole;
  readOnly: boolean;
}>();

const route = useRoute();
const sessionId = route.params.sessionId as string;

const emit = defineEmits<{
  (e: 'update:session', session: SessionBase): void;
  (e: 'audioUploaded'): void;
  (e: 'seek', time: number): void;
}>();

const showUploadAudioModal = ref(false);
const hasValidPlan = useHasValidPlan();

const startSeconds = ref(0);

const session = ref<SessionBase | null>(null);

onMounted(async () => {
  try {
    const getSessionResponse = await getSession(parseInt(sessionId));
    session.value = getSessionResponse.data as SessionBase;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    // Handle error (e.g., show error message to user)
  }
});

function handleAudioUpload(payload: { audioUri: string; audioName: string }) {
  if (session.value) {
    const updatedSession = {
      ...session.value,
      ...payload,
    };
    session.value = updatedSession;
    emit('update:session', updatedSession);
    showUploadAudioModal.value = false;
    emit('audioUploaded');
  }
}

async function tryDeleteSessionAudio() {
  const deleteAudio = confirm(
    "Are you sure you want to delete this session's audio? This will also delete any associated transcripts.",
  );

  if (!deleteAudio) {
    return;
  }

  if (session.value?.audioUri) {
    const updatedSession = {
      ...session.value,
      audioUri: '',
      audioName: '',
    };
    session.value = updatedSession;

    await deleteSessionAudio(session.value.id);
  }
}

const clickUploadAudio = () => {
  if (!hasValidPlan(BillingPlan.Basic)) {
    showUpgradeModal({
      feature: 'Upload Session Audio',
      requiredPlan: BillingPlan.Basic,
      redirectUri: location.href,
    });
  } else {
    showUploadAudioModal.value = true;
  }
};
</script>

<template>
  <div class="bg-surface rounded-[18px] flex justify-start p-4">
    <div v-if="session?.audioUri" class="flex justify-start w-full">
      <AudioPlayback
        class="self-center"
        :audio-name="session?.audioName"
        :audio-uri="session?.audioUri"
        :start="startSeconds"
        :has-transcription="!!session?.sessionTranscription?.transcription"
        @seek="$emit('seek', $event)"
      />

      <button
        class="button-primary ml-2 h-12 self-center group hover:bg-neutral-900"
        @click="tryDeleteSessionAudio"
      >
        <TrashIcon class="w-4 h-4 group-hover:text-red-500" />
      </button>
    </div>

    <div
      v-else-if="currentUserRole === CampaignRole.DM && !readOnly"
      class="button-ghost flex mr-2"
      @click="clickUploadAudio"
    >
      <MicrophoneIcon class="w-4 h-4 mr-1 self-center" />
      <span class="self-center">Upload Session Audio</span>
    </div>
    <div v-else>No audio has been uploaded for this session.</div>
  </div>

  <ModalAlternate
    :show="showUploadAudioModal"  
    @close="showUploadAudioModal = false"
    v-if="session"
  >
    <div class="md:w-[499px] p-6 bg-neutral-900 rounded-[20px]">
      <AudioUpload :session="session" @audio-uploaded="handleAudioUpload" />
    </div>
  </ModalAlternate>
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