<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { computed, onMounted, ref } from 'vue';
import {
  SessionBase,
  deleteSession,
  getSession,
  patchSession,
  postCompleteSession,
  postSessionAudio,
} from '@/api/sessions.ts';
import { useRoute, useRouter } from 'vue-router';
import { showError, showSuccess } from '@/lib/notifications.ts';
import DatePicker from '@/components/Core/Forms/DatePicker.vue';
import TimePicker from '@/components/Core/Forms/TimePicker.vue';
import { format, parseISO } from 'date-fns';
import Menu from '@/components/Core/General/Menu.vue';
import { ChevronDownIcon } from '@heroicons/vue/20/solid';
import { MenuButton, MenuItem } from '@headlessui/vue';
import ModalAlternate from '@/components/ModalAlternate.vue';

const route = useRoute();
const router = useRouter();

const session = ref<SessionBase>({} as SessionBase);
const newSession = computed(() => route.params.sessionId === 'new');

const whenDate = ref({
  year: 2023,
  month: 8,
  day: 12,
});

const whenTime = ref({
  hours: 8,
  minutes: 30,
  ampm: 'PM',
});

const editWhen = ref(false);
const showCompleteSession = ref(false);
const recap = ref('');

const whenDateString = computed(() =>
  session.value?.when ? format(parseISO(session.value.when), 'PP') : '',
);
const whenTimeString = computed(() =>
  session.value?.when ? format(parseISO(session.value.when), 'p') : '',
);

const bgImageStyle = computed(
  () =>
    `background: url('${
      session.value.imageUri
        ? session.value.imageUri
        : '/images/session_bg_square.png'
    }'); background-size: 20%; background-position: center;`,
);

onMounted(async () => {
  await init();
});

async function init() {
  const response = await getSession(
    parseInt(route.params.sessionId.toString()),
  );
  session.value = response.data as SessionBase;
  const date = new Date(session.value.when);

  whenDate.value = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };

  whenTime.value = {
    hours: date.getHours() >= 13 ? date.getHours() - 12 : date.getHours(),
    minutes: date.getMinutes(),
    ampm: date.getHours() >= 12 ? 'PM' : 'AM',
  };
}

async function clickSaveSession() {
  const putSessionResponse = await patchSession({
    ...session.value,
    when: new Date(
      whenDate.value.year,
      whenDate.value.month - 1,
      whenDate.value.day,
      whenTime.value.ampm === 'PM'
        ? whenTime.value.hours + 12
        : whenTime.value.hours,
      whenTime.value.minutes,
      0,
      0,
    ),
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: 'Session saved' });
  } else {
    showError({ message: 'Failed to save session' });
  }
}

async function clickDeleteSession() {
  const deleteSessionResponse = await deleteSession(session.value.id);

  if (deleteSessionResponse.status === 200) {
    showSuccess({ message: 'Session deleted successfully!' });
    await router.push('/sessions');
  } else {
    showError({ message: 'Failed to delete session. Try again soon!' });
  }
}

async function completeSession() {
  try {
    await postCompleteSession(session.value.id, { recap: recap.value });
    showSuccess({
      message:
        'Session completed! This session will update soon with an image, summary and suggestions.',
    });

    const intervalId = setInterval(async () => {
      await init();

      if (session.value.imageUri) {
        clearInterval(intervalId);
      }
    }, 5000);

    showCompleteSession.value = false;
  } catch (e) {
    showError({ message: 'Failed to complete session. Try again soon!' });
  }
}

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
      const response = await postSessionAudio(session.value.id, formData);
      session.value.audioUri = response.data.audioUri;
      session.value.audioName = response.data.audioName;

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
function getAudioUri() {
  if (session.value.audioUri?.startsWith('https')) {
    return session.value.audioUri;
  } else {
    return `https://${session.value.audioUri}`;
  }
}
</script>

<template>
  <div v-if="session" class="my-8">
    <div
      class="rounded-md flex flex-col justify-between md:h-[30rem]"
      :style="bgImageStyle"
    >
      <div class="p-4 flex justify-between">
        <router-link
          :to="`/sessions`"
          class="bg-surface-2 flex rounded-xl border-2 border-gray-600/50 p-3"
        >
          <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back to list
        </router-link>

        <div v-if="session.status === 1" class="flex">
          <button
            class="h-12 rounded-md bg-green-500 px-3 py-1 transition-all hover:scale-110"
            @click="clickSaveSession"
          >
            Save
          </button>

          <button
            class="ml-2 rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-1 h-12 transition-all hover:scale-110"
            @click="showCompleteSession = true"
          >
            Complete Session
          </button>

          <Menu>
            <MenuButton
              class="bg-surface-2 ml-2 flex h-12 w-full justify-center rounded-md border-2 border-gray-600/50 px-3 py-1 text-white transition-all hover:scale-110"
            >
              <span class="text-md self-center"> More </span>
              <ChevronDownIcon
                class="-mr-1 ml-2 h-5 w-5 self-center text-violet-200 hover:text-violet-100"
                aria-hidden="true"
              />
            </MenuButton>
            <template #content>
              <div class="rounded-xl bg-gray-800/75 p-4">
                <MenuItem>
                  <button
                    v-if="!newSession"
                    class="w-full rounded-xl border-2 border-red-500 px-3 py-1"
                    @click="clickDeleteSession"
                  >
                    Delete
                  </button>
                </MenuItem>
              </div>
            </template>
          </Menu>
        </div>
        <div v-else class="rounded-md bg-green-500 px-4 text-lg flex">
          <span class="self-center">completed</span>
        </div>
      </div>

      <div class="p-4 rounded-b-md flex bg-black/75">
        <div v-if="editWhen">
          <div class="text-md mb-2 mt-4 text-gray-400">
            Which day will it take place?
          </div>
          <DatePicker v-model="whenDate" class="w-56" />

          <div class="text-md mb-2 mt-4 text-gray-400">
            At what time will it take place?
          </div>
          <TimePicker v-model="whenTime" class="w-56" />
        </div>
        <div v-else>
          <div class="text-3xl">
            {{ session.status === 2 ? session.name : whenDateString }}
          </div>
          <div class="text-xl text-gray-400">
            {{ session.status === 2 ? whenDateString : whenTimeString }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="session.audioUri">
    <div class="text-lg self-center text-white mb-2">Session Recording</div>
    <audio controls preload="auto">
      <source :src="getAudioUri()" type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  </div>
  <div v-else class="mb-4">
    <div class="text-lg self-center text-white">Session Audio</div>
    <div class="text-sm text-neutral-500 mb-3">
      Upload a recording of your session to share with your players.
    </div>
    <div class="flex">
      <div class="flex-grow">
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
        <input id="audio_file_input" type="file" @change="audioFileChanged" />
        <p
          id="file_input_help"
          class="mt-1 text-xs text-gray-400 dark:text-gray-600 px-1"
        >
          MP3 Only (MAX. 600MB).
        </p>
      </div>
      <div class="pl-2">
        <button
          class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
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
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        </button>
      </div>
    </div>
    <div v-if="audioFileUploading" class="mt-4 mb-2">
      <div class="text-sm text-neutral-500 mb-3">
        Please wait a moment for your file to upload. For larger files the
        upload process can take a few minutes.
      </div>
    </div>
  </div>

  <div
    v-if="session.status === 1"
    class="mt-8 border-t-2 border-gray-600/25 pt-8"
  >
    <div class="text-lg self-center text-white">Description</div>
    <div class="text-md text-neutral-500">
      Briefly describe what you think is to come in the next session, without
      any spoilers (this can help players prepare their characters).
    </div>
    <textarea
      v-model="session.description"
      class="gradient-border-no-opacity mt-4 h-[8rem] w-full rounded-xl border bg-black p-4 text-left text-lg text-white"
    />
  </div>
  <div v-else>
    <div class="text-lg self-center text-white">Summary</div>
    <div class="text-sm text-neutral-500">
      This is an AI generated summary of the campaign based on the DM's provided
      recap
    </div>
    <div class="mt-4 text-xl text-white gradient-border-no-opacity p-5">
      {{ session.summary || 'No summary provided' }}
    </div>

    <div class="mt-8 text-lg self-center text-white">Suggestions</div>
    <div class="text-sm text-neutral-500">
      This is an AI generated set of suggestions to improve the players
      roleplaying.
    </div>
    <div class="mt-4 text-xl text-white gradient-border-no-opacity p-5">
      {{ session.suggestions || 'No suggestions provided' }}
    </div>
  </div>

  <ModalAlternate :show="showCompleteSession">
    <div class="md:w-[800px] p-6 bg-neutral-900 rounded-[20px]">
      <div class="text-3xl">You did it!</div>
      <div
        class="my-2 text-xl bg-clip-text font-bold text-transparent bg-gradient-to-r from-fuchsia-500 to-blue-400"
      >
        Congrats. We hope it was fun.
      </div>
      <div class="text-md text-neutral-500">
        And we hope
        <span class="text-neutral-400 font-semibold">MythWeaver</span> helped
        make it more fun.
      </div>

      <div class="mt-8 text-lg self-center text-white">Recap</div>
      <div class="text-md text-neutral-500">
        Describe what happened in the session. We will use this information to
        generate a summary, image and other cool stuff.
      </div>

      <textarea
        v-model="recap"
        class="w-full h-32 md:h-80 mt-2 resize-none rounded-md bg-surface border border-neutral-800 text-white"
      >
      </textarea>

      <div class="flex mt-8 justify-between">
        <button
          class="flex self-center mr-2 rounded-md border border-neutral-700 px-4 py-3 transition-all hover:scale-110"
          @click="showCompleteSession = false"
        >
          <span class="self-center">Nevermind</span>
        </button>

        <button
          class="flex self-center rounded-md bg-gradient-to-r from-fuchsia-500 to-blue-400 px-4 py-3 transition-all hover:scale-110"
          @click="completeSession"
        >
          <span class="self-center">Complete Session</span>
        </button>
      </div>
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
