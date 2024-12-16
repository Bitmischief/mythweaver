<script setup lang="ts">
import { onBeforeMount } from 'vue';
import ConjurationListHeader from './conjurationListHeader.vue';
import ConjurationListData from './conjurationListData.vue';
import { useConjurationStore } from '../../store/conjuration.store';
import { storeToRefs } from 'pinia';

const { conjurationListFlags } = storeToRefs(useConjurationStore());

const props = defineProps<{
  mine: boolean;
}>();

onBeforeMount(() => {
  conjurationListFlags.value.mine = props.mine;
  conjurationListFlags.value.saved = props.mine;
});
</script>

<template>
  <ConjurationListHeader />
  <ConjurationListData />
</template>
