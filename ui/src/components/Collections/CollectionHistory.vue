<script setup lang="ts">
import { ArrowRightIcon } from '@heroicons/vue/24/outline';
import { computed, ref, unref } from 'vue';
import { useDrop } from 'vue3-dnd';

const [dropCollect, drop] = useDrop(() => ({
  accept: ['Conjuration', 'Collection'],
  drop: () => ({
    id: props.data?.id,
    name: props.data?.name,
    type: 'Collection',
  }),
  collect: (monitor) => ({
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }),
}));
const canDrop = computed(() => unref(dropCollect).canDrop);
const isOver = computed(() => unref(dropCollect).isOver);
const isActive = computed(() => unref(canDrop) && unref(isOver));

const props = defineProps<{
  data: any;
}>();

const collection = ref(props.data);
</script>

<template>
  <div
    :ref="drop"
    class="flex gap-4 px-2 hover:underline hover:cursor-pointer rounded-[12px]"
    :class="{
      'outline outline-fuchsia-500': unref(canDrop),
      'bg-fuchsia-500/75 blur-sm': unref(isActive),
    }"
  >
    <div class="max-w-[10em] overflow-hidden text-ellipsis">
      {{ collection.name }}
    </div>
    <ArrowRightIcon class="h-5 w-5 self-center" />
  </div>
</template>

<style scoped></style>
