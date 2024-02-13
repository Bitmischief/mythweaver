<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { PlayCircleIcon, PauseCircleIcon } from '@heroicons/vue/24/outline';

import { Howl, Howler } from 'howler';

const emit = defineEmits(['seek']);

const props = defineProps<{
  audioName: string | undefined;
  audioUri: string | undefined;
  start: number;
}>();

const sound = ref();
onMounted(() => {
  sound.value = new Howl({
    src: cleanedAudioUri(),
    html5: true,
    autoplay: false,
    loop: false,
    volume: 1,
  });

  Howler.autoSuspend = false;

  sound.value.on('play', () => {
    window.requestAnimationFrame(updateSeekBar);
  });
  sound.value.on('seek', () => {
    window.requestAnimationFrame(updateSeekBar);
  });
});

watch(
  () => props.start,
  () => {
    seek(props.start);
  },
);

const width = ref(0);

const updateSeekBar = () => {
  width.value = (sound.value.seek() / sound.value.duration()) * 100 + 0.5;
  emit('seek', sound.value.seek());
  if (sound.value.playing()) {
    window.requestAnimationFrame(updateSeekBar);
  }
};

const playPause = () => {
  if (sound.value.playing()) {
    sound.value.pause();
  } else {
    sound.value.play();
  }
};

const seek = (seconds: number) => {
  if (!sound.value.playing()) {
    sound.value.once('play', () => {
      sound.value.seek(seconds);
    });
    sound.value.load();
    sound.value.play();
  } else {
    sound.value.seek(seconds);
  }
};

const seekbarClick = (e: any) => {
  const layerX = e.layerX;
  const widthX = e.currentTarget.offsetWidth;
  const perc = layerX / widthX;

  seek(sound.value.duration() * perc);
};

const playing = computed(() => {
  if (!sound.value) {
    return false;
  }
  return sound.value.playing();
});

const cleanedAudioUri = () => {
  if (props.audioUri?.startsWith('https')) {
    return `${props.audioUri}#t=${props.start}`;
  } else {
    return `https://${props.audioUri}#t=${props.start}`;
  }
};
</script>

<template>
  <div class="w-full">
    <div v-if="sound">
      <div class="w-full text-center">
        {{ audioName }}
      </div>
      <div class="flex w-full">
        <button class="self-center" @click="playPause">
          <PlayCircleIcon v-if="!playing" class="h-8" />
          <PauseCircleIcon v-else class="h-8" />
        </button>
        <div
          class="grow h-3 self-center relative mx-4 hover:cursor-pointer"
          @click="seekbarClick"
        >
          <div
            class="absolute top-0 left-0 bottom-0 right-0 bg-surface-3 rounded-full"
          ></div>
          <div
            class="absolute top-0 left-0 bottom-0 bg-gradient rounded-full z-10"
            :style="`width: ${width}%`"
          >
            <div class="h-3 w-3 rounded-full bg-white z-20 ml-auto"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
