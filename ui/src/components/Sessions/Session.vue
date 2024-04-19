<script lang="ts" setup>
import { SessionBase } from '@/api/sessions.ts';
import { computed, ref, onMounted } from 'vue';
import { format } from 'date-fns';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  session: SessionBase;
  dense?: boolean;
}>();

onMounted(() => {
  if (props.session.audioUri) {
    let audioUri = props.session.audioUri;
    if (!props.session.audioUri?.startsWith('https')) {
      audioUri = `https://${props.session.audioUri}`;
    }
    const sessionAudio = new Audio(audioUri);
    sessionAudio.addEventListener('loadedmetadata', () => {
      var h = Math.floor(sessionAudio.duration / 3600);
      var m = Math.floor((sessionAudio.duration % 3600) / 60);
      sessionDuration.value = `${h}h ${m}m`;
    });
  }
});

const sessionDuration = ref('N/A');
const sessionType = computed(() => {
  if (props.session.completed) {
    return 'Completed';
  } else if (props.session.archived) {
    return 'Archived';
  } else if (props.session.planning || props.session.recap) {
    return 'In Progress';
  } else {
    return 'Upcoming';
  }
});

const sessionDate = computed(() => {
  if (!props.session.date) {
    return 'TBD';
  }
  return format(props.session.date, 'MMM d, yyyy @ h:mm a');
});
</script>

<template>
  <div
    class="relative flex cursor-pointer justify-end rounded-[20px] shadow-xl bg-surface-2 p-2"
    :class="{ 'flex-col': !dense, 'flex-row': dense }"
  >
    <div
      :class="{
        'basis-1/3 my-auto': dense,
        'basis-1': !dense,
      }"
    >
      <img
        :src="session.imageUri || '/images/session_bg_square.png'"
        alt="session image"
        class="rounded-[16px]"
      />
    </div>

    <div
      class="absolute left-4 top-4 flex h-6 justify-center items-center rounded-full bg-white/50 group text-black text-xs font-bold px-4"
      :class="{ hidden: dense }"
    >
      {{ sessionType }}
    </div>

    <div
      class="flex w-full justify-between rounded-b-lg bg-surface-2 px-3 pb-2"
      :class="{
        'basis-1': !dense,
        'basis-2/3 pt-2 overflow-hidden': dense,
      }"
    >
      <div class="max-w-[100%]">
        <div class="relative text-md truncate">
          {{ session.name || 'No Summary Provided' }}
        </div>
        <div class="text-sm text-neutral-500 my-2">
          <div class="flex mb-2">
            <CalendarDaysIcon class="h-5 mr-1" />
            <div>
              {{ sessionDate }}
            </div>
          </div>
          <div v-if="session.audioUri" class="flex">
            <ClockIcon class="h-5 mr-1" />
            {{ sessionDuration }}
          </div>
        </div>
        <div class="text-sm text-neutral-500 truncate-2-line">
          {{ session.summary || 'Add a summary to generate a recap' }}
        </div>
      </div>
    </div>
  </div>
</template>
