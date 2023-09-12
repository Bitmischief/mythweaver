<script setup lang="ts">
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';
import { computed, onMounted, ref } from 'vue';
import {
  SessionBase,
  deleteSession,
  getSession,
  patchSession,
  postCompleteSession,
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
