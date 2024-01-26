<script lang="ts" setup>
import { SessionBase } from '@/api/sessions.ts';
import { computed, ref, onMounted } from 'vue';
import { format } from 'date-fns';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  session: SessionBase;
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
</script>

<template>
  <div class="transition-all ease-in-out hover:scale-[105%]">
    <div
      class="relative flex cursor-pointer flex-col justify-end rounded-[20px] shadow-xl bg-surface-2"
    >
      <div class="m-2">
        <img
          :src="session.imageUri || '/images/session_bg_square.png'"
          class="rounded-[16px]"
        />
      </div>

      <div
        class="absolute left-4 top-4 flex h-6 justify-center items-center rounded-full bg-white/50 group text-black text-xs font-bold px-4"
      >
        {{ sessionType }}
      </div>

      <div
        class="flex w-full justify-between rounded-b-lg bg-surface-2 px-3 pb-2"
      >
        <div class="max-w-[100%]">
          <div class="relative text-md truncate">
            {{ session.name || 'No Summary Provided' }}
          </div>
          <div class="flex text-sm text-neutral-500 my-2">
            <div v-if="session.audioUri" class="flex mr-4">
              <ClockIcon class="h-5 mr-1" />
              {{ sessionDuration }}
            </div>
            <div class="flex">
              <CalendarDaysIcon class="h-5 mr-1" />
              {{ format(new Date(session.updatedAt), 'MMMM d, yyyy') }}
            </div>
          </div>
          <div class="text-sm text-neutral-500 truncate-2-line">
            {{ session.summary || 'Add a summary to generate a recap' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
