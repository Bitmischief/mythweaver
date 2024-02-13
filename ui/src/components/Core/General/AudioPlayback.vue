<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  audioUri: string | undefined;
  start: string | '00:00:00';
}>();

const cleanedAudioUri = computed(() => {
  if (props.audioUri?.startsWith('https')) {
    return `${props.audioUri}#t=${props.start}`;
  } else {
    return `https://${props.audioUri}#t=${props.start}`;
  }
});
</script>

<template>
  <div>
    <audio controls preload="auto" class="h-[2em]">
      <source :src="cleanedAudioUri" type="audio/mpeg" oncanplaythrough="this.play()" />
    </audio>
  </div>
</template>
