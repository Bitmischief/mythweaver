<script lang="ts" setup>
import { Conjuration, patchConjuration } from '@/api/conjurations.ts';
import { showSuccess } from '@/lib/notifications.ts';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useCurrentUserId } from '@/lib/hooks.ts';
import { useEventBus } from '@/lib/events.ts';
import TextEdit from '@/components/Core/Forms/TextEdit.vue';

const props = defineProps<{
  conjuration: Conjuration;
}>();

const eventBus = useEventBus();
const currentUserId = useCurrentUserId();

const userOwnsConjuration = computed(() => {
  return props.conjuration?.userId === currentUserId.value;
});

const dataArray = computed(() => {
  if (!props.conjuration) {
    return [];
  }

  return Object.keys(props.conjuration.data).map((key) => {
    return {
      key,
      value: props.conjuration.data[key],
    };
  });
});

const editDataKey = ref<string | undefined>(undefined);

onMounted(() => {
  eventBus.$on('conjuration-save-info', async () => {
    if (editDataKey.value) {
      editDataKey.value = undefined;
      await saveData();
    }
  });
});

onUnmounted(() => {
  eventBus.$off('conjuration-save-info');
});

watch(
  dataArray,
  async () => {
    console.log('watch dataArray');
    await saveData();
  },
  { deep: true },
);

async function saveData() {
  if (!props.conjuration) return;

  const data = Object.fromEntries(dataArray.value.map((x) => [x.key, x.value]));
  await patchConjuration(props.conjuration.id, { data });

  showSuccess({ message: 'Updated conjuration!' });
}
</script>

<template>
  <div v-for="(data, i) in dataArray" :key="`data-${i}`">
    <div class="mt-8 text-2xl">
      {{ data.key }}
    </div>
    <TextEdit
      v-model="data.value"
      :data-key="data.key"
      :disabled="!userOwnsConjuration"
      @change="saveData"
    />
  </div>
</template>
