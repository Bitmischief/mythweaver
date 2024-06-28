<script setup lang="ts">
import { computed, ref, unref } from 'vue';
import { useDrop } from 'vue3-dnd';

const props = defineProps<{
  data: any;
  droppable?: boolean;
}>();

const collection = ref(props.data);

const [dropCollect, drop] = useDrop(() => ({
  accept: collection.value?.id ? ['Conjuration', 'Collection'] : ['Collection'],
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
</script>

<template>
  <div
    :ref="droppable ? drop : undefined"
    class="flex gap-2 hover:underline hover:cursor-pointer"
  >
    <div
      class="max-w-[10em] overflow-hidden text-ellipsis rounded-[12px] px-2"
      :class="{
        'outline outline-fuchsia-500': droppable && unref(canDrop),
        'bg-fuchsia-500/75 blur-sm': droppable && unref(isActive),
      }"
    >
      {{ collection.name }}
    </div>
  </div>
</template>

<style scoped></style>
