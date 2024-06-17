<script setup lang="ts">
import { computed, ref, unref } from 'vue';
import { patchCollection, postMoveCollection } from '@/api/collections.ts';
import { showError } from '@/lib/notifications.ts';
import { useDrag, useDrop } from 'vue3-dnd';

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

const [collect, drag] = useDrag(() => ({
  type: 'Collection',
  item: () => ({
    id: props.data?.id,
    name: props.data?.name,
    type: 'Collection',
  }),
  end: async (item, monitor) => {
    const dropResult = monitor.getDropResult<{
      id: number;
      name: string;
      type: string;
    }>();
    if (
      item.type === 'Collection' &&
      dropResult?.type === 'Collection' &&
      item.id !== dropResult.id
    ) {
      await postMoveCollection(item.id, { parentCollectionId: dropResult.id });
    }
  },
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
    handlerId: monitor.getHandlerId(),
  }),
}));
const isDragging = computed(() => collect.value.isDragging);
const opacity = computed(() => (unref(isDragging) ? 0.75 : 1));

const emit = defineEmits(['updated', 'open']);
const props = defineProps<{
  data: any;
}>();

const collection = ref(props.data);

const updateCollection = async (collection: any) => {
  try {
    await patchCollection(collection.id, {
      name: collection.name,
    });
    emit('updated');
  } catch {
    showError({ message: 'Failed to save collection. Please try again.' });
  }
};
</script>

<template>
  <div :ref="drag" :style="{ opacity }">
    <div
      :ref="drop"
      class="rounded-[12px] border border-neutral-800 w-full aspect-square grid grid-cols-2 p-1 cursor-pointer"
      :class="{
        'outline outline-fuchsia-500': unref(canDrop),
        'bg-fuchsia-500/75 blur-sm': unref(isActive),
      }"
      @click="emit('open')"
    >
      <div
        v-for="(uri, k) in collection.placeholders?.slice(0, 4) || []"
        :key="`placeholder_${k}`"
        class="h-full w-full p-1"
      >
        <img
          :src="uri"
          class="h-full w-full rounded-[8px]"
          alt="collection img"
        />
      </div>
      <div
        v-for="sq in Math.max(0, 4 - collection.placeholders.length)"
        :key="`sq_${sq}`"
        class="aspect-square h-full w-full p-1"
      >
        <div class="w-full h-full bg-neutral-800/25 rounded-[8px]"></div>
      </div>
    </div>
    <div class="mt-1 w-full">
      <FormKit
        v-model="collection.name"
        inner-class="$reset w-full p-1 border-neutral-800"
        input-class="$reset text-sm bg-transparent [&:not(:focus-visible)]:border-none p-0 w-full truncate focus:input-secondary"
        type="text"
        @focusout="updateCollection(collection)"
      />
    </div>
  </div>
</template>

<style scoped></style>
