<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  audioUri: string | undefined;
}>();

const cleanedAudioUri = computed(() => {
  if (props.audioUri?.startsWith('https')) {
    return props.audioUri;
  } else {
    return `https://${props.audioUri}`;
  }
});
</script>

<template>
  <div>
    <audio controls preload="auto">
      <source :src="cleanedAudioUri" type="audio/mpeg" />
    </audio>
  </div>
</template>
