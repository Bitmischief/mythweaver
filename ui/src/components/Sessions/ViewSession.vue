<script setup lang="ts">
import { ArrowLeftIcon } from "@heroicons/vue/24/solid";
import { computed, onMounted, ref } from "vue";
import {
  SessionBase,
  deleteSession,
  getSession,
  patchSession,
} from "@/api/sessions.ts";
import { useRoute, useRouter } from "vue-router";
import { showError, showSuccess } from "@/lib/notifications.ts";
import DatePicker from "@/components/Core/Forms/DatePicker.vue";
import TimePicker from "@/components/Core/Forms/TimePicker.vue";
import { format, parseISO } from "date-fns";
import Menu from "@/components/Core/General/Menu.vue";
import { ChevronDownIcon } from "@heroicons/vue/20/solid";
import { MenuButton, MenuItem } from "@headlessui/vue";
import Typewriter from "@/components/Utility/Typewriter.vue";
const route = useRoute();
const router = useRouter();
const session = ref<SessionBase>({} as SessionBase);
const newSession = computed(() => route.params.sessionId === "new");

const whenDate = ref({
  year: 2023,
  month: 8,
  day: 12,
});

const whenTime = ref({
  hours: 8,
  minutes: 30,
  ampm: "PM",
});

const editWhen = ref(false);

const whenDateString = computed(() =>
  session.value?.when ? format(parseISO(session.value.when), "PP") : ""
);
const whenTimeString = computed(() =>
  session.value?.when ? format(parseISO(session.value.when), "p") : ""
);

onMounted(async () => {
  const response = await getSession(
    parseInt(route.params.sessionId.toString())
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
    ampm: date.getHours() >= 12 ? "PM" : "AM",
  };
});

async function clickSaveSession() {
  const putSessionResponse = await patchSession({
    ...session.value,
    when: new Date(
      whenDate.value.year,
      whenDate.value.month - 1,
      whenDate.value.day,
      whenTime.value.ampm === "PM"
        ? whenTime.value.hours + 12
        : whenTime.value.hours,
      whenTime.value.minutes,
      0,
      0
    ),
  });

  if (putSessionResponse.status === 200) {
    showSuccess({ message: "Session saved" });
  } else {
    showError({ message: "Failed to save session" });
  }
}

async function clickDeleteSession() {
  const deleteSessionResponse = await deleteSession(session.value.id);

  if (deleteSessionResponse.status === 200) {
    showSuccess({ message: "Session deleted successfully!" });
    await router.push("/sessions");
  } else {
    showError({ message: "Failed to delete session. Try again soon!" });
  }
}
</script>

<template>
  <div class="my-8 flex justify-between">
    <router-link
      :to="`/sessions`"
      class="bg-surface-2 flex rounded-xl border-2 border-gray-600/50 p-3"
    >
      <ArrowLeftIcon class="mr-2 h-4 w-4 self-center" /> Back to list
    </router-link>

    <div class="flex">
      <button
        class="h-12 rounded-xl bg-green-500 px-3 py-1"
        @click="clickSaveSession"
      >
        Save
      </button>

      <Menu>
        <MenuButton
          class="bg-surface-2 ml-2 flex h-12 w-full justify-center rounded-xl border-2 border-gray-600/50 px-3 py-1 text-white"
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
  </div>

  <div v-if="session">
    <div class="flex">
      <div style="width: calc(100% - 12rem)">
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
          <div class="text-3xl">{{ whenDateString }}</div>
          <div class="text-xl text-gray-400">{{ whenTimeString }}</div>
        </div>
      </div>
    </div>

    <div class="mt-8 self-center text-2xl text-white">Transcript</div>

    <div
      class="relative mt-2 h-[15rem] overflow-y-hidden bg-black/50 text-lg text-green-300"
    >
      <div class="absolute flex h-full w-full justify-center bg-black/80">
        <div class="self-center text-3xl font-black text-purple-500">
          COMING SOON
        </div>
      </div>
      <Typewriter
        class="p-3"
        :speed="25"
        :content="`Grog: I approach the towering, ominous door, its wooden planks older than time itself, creaking as I lay my hand upon it. I push it open, my muscles bulging, and... it squeaks?
<np>
Everyone: (Laughs)
<np>
Grog: Alright, not exactly the dramatic scene I was going for, but let's roll with it. I look around; what do I see?
<np>
DM: The room is largely empty, but in the center, there's a small, round table. Sitting atop it is a single muffin.
<np>
Quill: Wait, wait, a muffin? That's it? Are you sure it's not a magical muffin?
<np>
DM: Roll an Arcana check, Quill.
<np>
Quill: (Dice rolling) I got a 4.
<np>
DM: It's a very ordinary muffin.
<np>
Grog: I eat the muffin.
<np>
DM: Alright, you consume the muffin. It's blueberry.
<np>
Quill: I can't believe we just did a magic check on a muffin.
<np>
Everyone: (Laughs)
<np>
DM: Welcome to Dungeons and Dragons!`"
      />
    </div>

    <div class="mt-8 border-t-2 border-gray-600/25 pt-8">
      <div class="flex">
        <div class="text-md mr-6 w-24 self-center text-right text-white">
          Description
        </div>
        <textarea
          v-model="session.description"
          class="gradient-border-no-opacity mt-4 h-[8rem] w-full rounded-xl border bg-black p-4 text-left text-lg text-white"
        />
      </div>
    </div>

    <div class="mt-8 border-t-2 border-gray-600/25 pt-8">
      <div class="flex">
        <div class="text-md mr-6 w-24 self-center text-right text-white">
          Summary
        </div>
        <textarea
          v-model="session.summary"
          class="gradient-border-no-opacity mt-4 h-[8rem] w-full rounded-xl border bg-black p-4 text-left text-lg text-white"
        />
      </div>
    </div>
  </div>
</template>
