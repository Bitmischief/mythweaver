<script setup lang="ts">
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItem } from '@headlessui/vue';
import ConjurationListItemView from '@/components/Conjuration/ConjurationListItemView.vue';
import {
  ArrowRightEndOnRectangleIcon,
  EllipsisHorizontalIcon,
  MinusCircleIcon,
} from '@heroicons/vue/24/outline';
import { ref } from 'vue';
import { showError, showSuccess } from '@/lib/notifications.ts';
import { deleteCollectionConjuration } from '@/api/collections.ts';
import ModalAlternate from '@/components/ModalAlternate.vue';
import ConjurationMove from '@/components/Collections/ConjurationMove.vue';

const emit = defineEmits(['deleted']);
const props = defineProps<{
  data: any;
  collectionId: number;
}>();

const conjuration = ref(props.data);
const showMoveConjuration = ref(false);

const removeCollectionConjuration = async () => {
  try {
    await deleteCollectionConjuration(props.collectionId, conjuration.value.id);
    emit('deleted');
    showSuccess({ message: 'Conjuration removed from collection' });
  } catch {
    showError({
      message:
        'Failed to remove conjuration from collection. Please try again.',
    });
  }
};
</script>

<template>
  <div
    class="cursor-pointer absolute top-3 right-3 rounded-full bg-surface-3 p-1 z-10"
  >
    <Menu class="flex">
      <div class="flex">
        <MenuButton class="self-center mx-1 py-1">
          <EllipsisHorizontalIcon class="h-6 w-6 self-center" />
        </MenuButton>
      </div>

      <template #content>
        <div class="relative z-60 bg-surface-3 py-2 rounded-[12px]">
          <MenuItem @click="showMoveConjuration = true">
            <div class="menu-item">
              <button class="button-text flex gap-2">
                <ArrowRightEndOnRectangleIcon class="h-5 w-5" />
                Move Conjuration
              </button>
            </div>
          </MenuItem>
          <MenuItem @click="removeCollectionConjuration">
            <div class="menu-item">
              <button class="button-text flex gap-2 text-red-400">
                <MinusCircleIcon class="h-5 w-5" />
                Remove From Collection
              </button>
            </div>
          </MenuItem>
        </div>
      </template>
    </Menu>
  </div>
  <ConjurationListItemView
    :data="conjuration"
    :collection-id="collectionId"
    draggable
  />

  <ModalAlternate :show="showMoveConjuration">
    <ConjurationMove
      :data="conjuration"
      :collection-id="collectionId"
      @close="showMoveConjuration = false"
    />
  </ModalAlternate>
</template>

<style scoped></style>
