<script setup lang="ts">
import { ArrowRightIcon } from '@heroicons/vue/24/outline';
import { SessionBase, postSession } from '@/api/sessions.ts';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showSuccess } from '@/lib/notifications.ts';
import DatePicker from '@/components/Core/Forms/DatePicker.vue';
import TimePicker from '@/components/Core/Forms/TimePicker.vue';

const router = useRouter();
const today = new Date();

const whenDate = ref({
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  day: today.getDate(),
});

const whenTime = ref({
  hours: today.getHours() > 12 ? today.getHours() - 12 : today.getHours(),
  minutes: today.getMinutes().toString().padStart(2, '0'),
  ampm: today.getHours() > 12 ? 'PM' : 'AM',
});

const session = ref<SessionBase>({
  id: 0,
  campaignId: 0,
  description: '',
  summary: '',
  when: '',
} as SessionBase);

async function handleCreateSession() {
  const createSessionResponse = await postSession({
    ...session.value,
    when: new Date(
      whenDate.value.year,
      whenDate.value.month - 1,
      whenDate.value.day,
      whenTime.value.ampm === 'PM'
        ? whenTime.value.hours + 12
        : whenTime.value.hours,
      whenTime.value.minutes as unknown as number,
      0,
      0,
    ),
  });

  showSuccess({ message: 'Session created!' });
  await router.push(`/sessions/${createSessionResponse.data.id}/edit`);
}
</script>

<template>
  <div class="">
    <div class="text-lg">Let's Create A Session</div>

    <div class="text-md mb-2 mt-4 text-gray-400">
      Which day will it take place?
    </div>
    <DatePicker v-model="whenDate" class="w-64" />

    <div class="text-md mb-2 mt-4 text-gray-400">
      At what time will it take place?
    </div>
    <TimePicker v-model="whenTime" class="w-56" />

    <div class="text-md mb-2 mt-4 text-gray-400">Description (optional)</div>
    <textarea
      v-model="session.description"
      class="gradient-border-no-opacity h-[8rem] w-full rounded-xl border bg-black p-2 text-left text-lg text-white"
    />

    <button
      class="mt-8 rounded-xl bg-gradient p-3 px-5 text-lg"
      @click="handleCreateSession"
    >
      Create Your Session <ArrowRightIcon class="inline-block h-8" />
    </button>
  </div>
</template>
