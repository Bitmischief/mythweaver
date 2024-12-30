<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useConjurationStore } from '../../store/conjuration.store';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import Loader from '@/components/Core/Loader.vue';
import ConjurationEdit from './conjurationEdit.vue';

const route = useRoute();
const props = defineProps<{
  id: number;
}>();

const { getConjuration } = useConjurationStore();
const { conjuration, conjurationLoading } = storeToRefs(useConjurationStore());
const conjurationId = ref(props.id);

watch(
  () => route.params.conjurationId,
  async () => {
    await getConjuration(conjurationId.value);
  },
);

onMounted(async () => {
  if (route.params.conjurationId) {
    conjurationId.value = Number(route.params.conjurationId);
  }
  await getConjuration(conjurationId.value);
});
</script>

<template>
  <div v-if="conjurationLoading">
    <Loader />
  </div>
  <div v-if="conjuration">
    <ConjurationEdit />
  </div>
</template>
