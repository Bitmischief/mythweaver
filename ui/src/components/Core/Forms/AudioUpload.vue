<script lang="ts" setup>
import { ref } from 'vue';
import { postSessionAudio, SessionBase } from '@/api/sessions.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';

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
      const response = await postSessionAudio(props.session.id, formData);

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
          accept=".mp3,.wav"
          @change="audioFileChanged"
        />
        <p id="file_input_help" class="mt-1 text-xs text-neutral-400 px-1">
          .mp3, or .wav only (MAX. 600MB).
        </p>
      </div>
      <div class="mt-4">
        <button
          class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 text-white px-4 py-3 w-full transition-all hover:scale-110"
          :class="{
            'opacity-50 hover:scale-100': audioFile.name === undefined,
          }"
          :disabled="audioFile.name === undefined || audioFileUploading"
          @click="addSessionAudio"
        >
          <span v-if="!audioFileUploading" class="self-center">Upload</span>
          <div v-else>
            <svg
              class="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-fuchsia-500"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858
              100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50
              0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144
              50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094
              90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50
              9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              <path fill="currentColor" />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        </button>
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
