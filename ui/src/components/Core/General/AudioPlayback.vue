<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import {
  PlayCircleIcon,
  PauseCircleIcon,
  BarsArrowDownIcon,
} from '@heroicons/vue/24/outline';
import { useMediaControls } from '@vueuse/core';

const emit = defineEmits(['seek', 'jump']);

const props = defineProps<{
  audioName: string | undefined;
  audioUri: string | undefined;
  start: number;
  hasTranscription: boolean | false;
}>();

const seekbarStyle = computed(() => {
  return {
    width: (currentTime.value / duration.value) * 100 + '%',
  };
});

const cleanedAudioUri = () => {
  if (props.audioUri?.startsWith('https')) {
    return `${props.audioUri}#t=${props.start}`;
  } else {
    return `https://${props.audioUri}#t=${props.start}`;
  }
};

const audio = ref();
const { playing, currentTime, duration } = useMediaControls(audio, {
  src: cleanedAudioUri(),
});

watch(
  () => props.start,
  () => {
    seek(props.start);
  },
);

watch(currentTime, () => {
  emit('seek', currentTime.value);
});

const jumpToText = () => {
  emit('jump');
};

const seek = (seconds: number) => {
  currentTime.value = seconds;
};

const seekbarClick = (e: any) => {
  const layerX = e.layerX;
  const widthX = e.currentTarget.offsetWidth;
  const perc = layerX / widthX;

  seek(duration.value * perc);
};

const formattedDuration = computed(() => {
  return formatTime(duration.value);
});

const formattedCurrentTime = computed(() => {
  return formatTime(currentTime.value);
});

const formatTime = (seconds: number) => {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds - h * 3600) / 60);
  let s = Math.floor(seconds - h * 3600 - m * 60);

  let hs = h.toString();
  let ms = m.toString();
  let ss = s.toString();

  if (m < 10) {
    ms = '0' + m;
  }
  if (s < 10) {
    ss = '0' + s;
  }

  let hours = '';
  if (hs !== '0') {
    hours += hs + ':';
  }

  return hours + ms + ':' + ss;
};
</script>

<template>
  <div class="w-full">
    <audio ref="audio" />
    <div>
      <div class="w-full text-center">
        {{ audioName }}
      </div>
      <div class="flex w-full">
        <button
          class="self-center hover:text-fuchsia-500"
          @click.stop="playing = !playing"
        >
          <PlayCircleIcon v-if="!playing" class="h-8" />
          <PauseCircleIcon v-else class="h-8" />
        </button>
        <div v-if="hasTranscription" class="group ml-2 relative flex">
          <button class="hover:text-fuchsia-500" @click="jumpToText">
            <BarsArrowDownIcon class="h-8" />
          </button>
          <div
            class="absolute -top-10 -left-2 z-50 invisible group-hover:visible bg-surface-3 rounded-full whitespace-nowrap px-2 py-1"
          >
            Jump to current time in transcription
          </div>
        </div>
        <div
          class="min-w-[9em] text-center mx-2 self-center text-xs text-neutral-500"
        >
          {{ formattedCurrentTime }} / {{ formattedDuration }}
        </div>
        <div
          class="grow h-3 self-center relative hover:cursor-pointer"
          @click="seekbarClick"
        >
          <div
            class="absolute top-0 left-0 bottom-0 right-0 bg-surface-3 rounded-full"
          ></div>
          <div
            class="absolute top-0 left-0 bottom-0 bg-gradient rounded-full z-10"
            :style="seekbarStyle"
          >
            <div class="h-3 w-3 rounded-full bg-white z-20 ml-auto"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
