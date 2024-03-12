<script lang="ts" setup>
import { ref } from 'vue';
import { postSessionAudio, SessionBase } from '@/api/sessions.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { AxiosResponse } from 'axios';

const props = defineProps<{
  session: SessionBase;
}>();

const emit = defineEmits(['audio-uploaded']);

const audioFile = ref<File>({} as File);
async function audioFileChanged(e: any) {
  audioFile.value = e.target.files[0];
}
const audioFileUploading = ref(false);

async function addSessionAudio() {
  try {
    audioFileUploading.value = true;
    if (audioFile.value.name) {
      const file = audioFile.value as Blob;
      const formData = new FormData();
      formData.append('audioFile', file);

      let response: AxiosResponse<any, any>;
      try {
        response = await postSessionAudio(props.session.id, formData);
      } catch (e) {
        showError({
          message:
            'Failed to add session audio. Is your file more than 500MB? Please try again.',
        });
        return;
      }

      emit('audio-uploaded', response.data);

      showSuccess({
        message: 'Session audio added!',
      });
    }
  } catch (e) {
    showError({ message: 'Failed to add session audio. Please try again.' });
  } finally {
    audioFileUploading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="text-xl self-center text-white">Upload Session Audio</div>
    <div class="text-sm text-neutral-500 mb-3"></div>
    <div class="text-neutral-400">
      Upload a recording of your session to share with your players.

      <div class="flex-grow mt-4">
        <label
          :class="{
            'pointer-events-none cursor-not-allowed': audioFileUploading,
          }"
          class="block w-full text-sm px-4 py-3 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          for="audio_file_input"
        >
          <span v-if="audioFile.name !== undefined" class="text-fuchsia-500">{{
            audioFile.name
          }}</span>
          <span v-else>Upload file</span>
        </label>
        <input
          id="audio_file_input"
          type="file"
          accept=".mp3"
          @change="audioFileChanged"
        />
        <p id="file_input_help" class="mt-1 text-xs text-neutral-400 px-1">
          .mp3 only (MAX. 500MB)
        </p>
      </div>
      <div class="mt-4">
        <div
          class="button-gradient text-center text-white"
          :class="{
            'opacity-50': audioFile.name === undefined,
          }"
          :disabled="audioFile.name === undefined || audioFileUploading"
          @click="addSessionAudio"
        >
          <span v-if="!audioFileUploading" class="self-center">Upload</span>
          <div v-else class="animate-bounce">uploading in progress...</div>
        </div>
      </div>
      <div v-if="audioFileUploading" class="mt-4 mb-2"></div>
      <div class="text-sm text-neutral-500 mt-1">
        Please wait a moment for your file to upload. For larger files the
        upload process can take a few minutes.
      </div>
    </div>
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
