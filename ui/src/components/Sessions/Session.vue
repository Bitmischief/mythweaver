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

const sessionDate = computed(() => {
  if (!props.session.date) {
    return 'TBD';
  }
  return format(props.session.date, 'MMM d, yyyy @ h:mm a');
});

const primaryImageUri = computed(() => {
  if (props.session.images?.length) {
    return props.session.images?.find((i) => i.primary)?.uri;
  }
  return undefined;
});
</script>

<template>
  <div
    class="relative flex cursor-pointer rounded-[20px] max-h-[10em] shadow-xl bg-surface-2 p-2 group/session"
  >
    <div>
      <img
        :src="primaryImageUri || '/images/session_bg_square.png'"
        alt="session image"
        class="rounded-[16px] w-[9em] aspect-square"
      />
    </div>

    <div
      class="relative flex w-full justify-between rounded-b-lg bg-surface-2 px-3 pb-2 basis-2/3 pt-2 overflow-hidden"
    >
      <div class="max-w-[100%]">
        <div class="text-md truncate">
          {{ session.name }}
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
        <div class="shrink text-sm text-neutral-500">
          {{ session.recap || 'No recap has been added for this session' }}
        </div>
        <div
          class="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-surface-2"
        />
      </div>
    </div>
  </div>
</template>
