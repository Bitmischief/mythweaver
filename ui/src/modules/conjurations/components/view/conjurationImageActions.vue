<script setup lang="ts">
import { useConjurationStore } from '../../store/conjuration.store';
import { storeToRefs } from 'pinia';

const { conjuration } = storeToRefs(useConjurationStore());
</script>

<template>
  <div>asdf</div>
</template>
