<script setup lang="ts">
import Menu from '@/components/Core/General/Menu.vue';
import { MenuButton, MenuItems, MenuItem } from '@headlessui/vue';
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
  <div class="relative h-full">
    <Menu class="flex cursor-pointer">
      <div
        class="absolute top-3 right-3 flex rounded-full bg-surface-3 p-1 z-10"
      >
        <MenuButton class="flex self-center mx-1 py-1">
          <EllipsisHorizontalIcon class="h-6 w-6 self-center" />
        </MenuButton>
      </div>
      <MenuItems>
        <div
          class="absolute left-0 right-0 top-14 z-10 bg-surface-3 py-2 rounded-[12px]"
        >
          <MenuItem @click="showMoveConjuration = true">
            <div class="menu-item">
              <div class="button-text flex gap-2">
                <div class="self-center">
                  <ArrowRightEndOnRectangleIcon class="h-5 w-5" />
                </div>
                Move Conjuration
              </div>
            </div>
          </MenuItem>
          <MenuItem @click="removeCollectionConjuration">
            <div class="menu-item">
              <div class="button-text flex gap-2 text-red-400">
                <div class="self-center">
                  <MinusCircleIcon class="h-5 w-5" />
                </div>
                Remove From Collection
              </div>
            </div>
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
    <ConjurationListItemView
      :data="conjuration"
      :collection-id="collectionId"
      draggable
      hide-tags
    />
  </div>

  <ModalAlternate :show="showMoveConjuration">
    <ConjurationMove
      :data="conjuration"
      :collection-id="collectionId"
      @close="showMoveConjuration = false"
    />
  </ModalAlternate>
</template>

<style scoped></style>
