<script setup lang="ts">
import { computed, ref, unref } from 'vue';
import {
  deleteCollection,
  patchCollection,
  postMoveCollection,
} from '@/api/collections.ts';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { useDrag, useDrop } from 'vue3-dnd';
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import {
  ArrowRightEndOnRectangleIcon,
  EllipsisHorizontalIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline';
import ModalAlternate from '@/components/ModalAlternate.vue';
import CollectionMove from '@/components/Collections/CollectionMove.vue';

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

const emit = defineEmits(['updated', 'open']);
const props = defineProps<{
  data: any;
}>();

const collection = ref(props.data);
const showMoveCollection = ref(false);
const showConfirmDelete = ref(false);
const editingCollectionName = ref(false);

const canDrop = computed(() => unref(dropCollect).canDrop);
const isOver = computed(() => unref(dropCollect).isOver);
const isActive = computed(() => unref(canDrop) && unref(isOver));
const isDragging = computed(() => collect.value.isDragging);
const opacity = computed(() => (unref(isDragging) ? 0.25 : 1));

const updateCollection = async () => {
  try {
    await patchCollection(collection.value.id, {
      name: collection.value.name,
    });
    editingCollectionName.value = false;
    emit('updated');
  } catch {
    showError({ message: 'Failed to save collection. Please try again.' });
  }
};

const handleDeleteCollection = async () => {
  try {
    await deleteCollection(collection.value.id);
    emit('updated');
    showSuccess({ message: 'Collection deleted successfully.' });
  } catch {
    showError({ message: 'Failed to delete collection. Please try again.' });
  }
};

const editCollectionName = () => {
  editingCollectionName.value = true;
};
</script>

<template>
  <div :ref="drag" :style="{ opacity }" class="relative">
    <div
      class="cursor-pointer absolute top-3 right-3 rounded-full bg-surface-3 p-1 z-10"
    >
      <Menu class="flex">
        <div class="flex py-1">
          <MenuButton class="button-primary px-0 self-center mx-1 py-0">
            <EllipsisHorizontalIcon class="h-6 w-6 self-center" />
          </MenuButton>
        </div>

        <template #content>
          <div class="relative z-60 bg-surface-3 py-2 rounded-[12px]">
            <MenuItem @click="showMoveCollection = true">
              <div class="menu-item">
                <button class="button-text flex gap-2 w-full">
                  <ArrowRightEndOnRectangleIcon class="h-5 w-5" />
                  Move Collection
                </button>
              </div>
            </MenuItem>
            <MenuItem @click="showConfirmDelete = true">
              <div class="menu-item">
                <button class="button-text flex gap-2 text-red-400">
                  <XCircleIcon class="h-5 w-5" />
                  Delete Collection
                </button>
              </div>
            </MenuItem>
          </div>
        </template>
      </Menu>
    </div>
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
    <div class="relative flex mt-1">
      <div
        v-if="!editingCollectionName"
        class="text-sm p-2 w-full truncate cursor-pointer hover:bg-purple-800/20 rounded-[12px]"
        @click="editCollectionName"
      >
        {{ collection.name }}
      </div>
      <FormKit
        v-if="editingCollectionName"
        v-model="collection.name"
        inner-class="$reset w-full p-1 border-neutral-800"
        input-class="$reset input-secondary"
        type="text"
        @focusout="updateCollection"
      />
      <div v-if="editingCollectionName" class="mt-1">
        <button class="button-gradient py-3" @click="updateCollection">
          Done
        </button>
      </div>
    </div>
  </div>
  <ModalAlternate :show="showMoveCollection">
    <CollectionMove :data="collection" @close="showMoveCollection = false" />
  </ModalAlternate>
  <ModalAlternate :show="showConfirmDelete">
    <div v-if="collection" class="bg-surface-3 rounded-[12px] p-6">
      <div class="text-lg text-white text-center">
        <span class="text-neutral-400">Are you sure you want to</span>
        <span class="underline">
          permanently delete the
          <span class="text-red-500">"{{ collection.name }}"</span>
          collection?
        </span>
      </div>
      <div class="text-neutral-400 text-center my-6">
        This action <b class="text-neutral-200">cannot</b> be undone, this will
        permanently delete this collection and all sub-collections.
        <div class="underline my-6">Your conjurations will not be deleted</div>
      </div>
      <div class="flex gap-2 justify-center mt-4">
        <div>
          <FormKit
            label="Cancel"
            type="button"
            input-class="$reset button-ghost-white self-center"
            @click="showConfirmDelete = false"
          />
        </div>
        <div>
          <FormKit
            label="Confirm Delete"
            type="button"
            input-class="$reset button-gradient-red self-center"
            @click="handleDeleteCollection"
          />
        </div>
      </div>
    </div>
  </ModalAlternate>
</template>

<style scoped></style>
